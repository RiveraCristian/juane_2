# Guía de Deployment - Sistema SEREMIS Maule en DigitalOcean

Esta guía te llevará paso a paso para desplegar la aplicación de reportería SEREMIS Maule en un servidor DigitalOcean usando un Droplet Ubuntu.

## 📋 Tabla de Contenidos

1. [Creación del Droplet](#1-creación-del-droplet)
2. [Configuración Inicial del Servidor](#2-configuración-inicial-del-servidor)
3. [Instalación de Dependencias](#3-instalación-de-dependencias)
4. [Deployment de la Aplicación](#4-deployment-de-la-aplicación)
5. [Configuración de Nginx como Reverse Proxy](#5-configuración-de-nginx-como-reverse-proxy)
6. [Configuración de SSL con Let's Encrypt](#6-configuración-de-ssl-con-lets-encrypt)
7. [Configuración de PM2 para Producción](#7-configuración-de-pm2-para-producción)
8. [Opción Alternativa: Usar CyberPanel](#8-opción-alternativa-usar-cyberpanel)
9. [Mantenimiento y Troubleshooting](#9-mantenimiento-y-troubleshooting)

---

## 1. Creación del Droplet

### 1.1 Acceder a DigitalOcean

1. Inicia sesión en [DigitalOcean](https://www.digitalocean.com)
2. Haz clic en **"Create"** → **"Droplets"**

### 1.2 Configuración del Droplet

**Imagen del Sistema:**
- Ubuntu 22.04 LTS x64 (recomendado) o Ubuntu 24.04 LTS

**Plan:**
- **Basic** → **Regular** 
- Mínimo recomendado: **$6/mes** (1 GB RAM, 1 vCPU, 25 GB SSD)
- Para producción: **$12/mes** (2 GB RAM, 1 vCPU, 50 GB SSD)

**Datacenter:**
- Selecciona la región más cercana a tus usuarios (ej: New York, Toronto, San Francisco)

**Autenticación:**
- **Opción 1 (Recomendada):** SSH Key (más seguro)
- **Opción 2:** Password (genera una contraseña segura)

**Hostname:**
- Asigna un nombre descriptivo: `seremis-maule-prod`

**Tags (opcional):**
- `production`, `seremis`

Haz clic en **"Create Droplet"** y espera 1-2 minutos.

### 1.3 Obtener la IP del Droplet

Una vez creado, copia la **dirección IP pública** (ej: `159.89.123.45`)

---

## 2. Configuración Inicial del Servidor

### 2.1 Conectarse al Servidor

**Desde Windows (PowerShell/CMD):**
```bash
ssh root@TU_IP_DEL_DROPLET
```

**Desde Linux/Mac:**
```bash
ssh root@TU_IP_DEL_DROPLET
```

Acepta la huella digital escribiendo `yes`.

### 2.2 Actualizar el Sistema

```bash
apt update && apt upgrade -y
```

### 2.3 Crear un Usuario No-Root (Seguridad)

```bash
# Crear usuario
adduser seremis

# Agregar a grupo sudo
usermod -aG sudo seremis

# Cambiar a este usuario
su - seremis
```

**Nota:** A partir de ahora, usa este usuario en lugar de root.

### 2.4 Configurar Firewall

```bash
# Habilitar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 3. Instalación de Dependencias

### 3.1 Instalar Node.js (v20 LTS)

```bash
# Descargar el script de instalación de NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node -v   # Debe mostrar v20.x.x
npm -v    # Debe mostrar 10.x.x
```

### 3.2 Instalar Herramientas de Compilación

```bash
sudo apt install -y build-essential
```

### 3.3 Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Verifica que Nginx esté corriendo visitando `http://TU_IP` en el navegador. Deberías ver la página de bienvenida de Nginx.

### 3.4 Instalar Git

```bash
sudo apt install -y git
```

### 3.5 Instalar PM2 (Gestor de Procesos)

```bash
sudo npm install -g pm2
```

---

## 4. Deployment de la Aplicación

### 4.1 Crear Directorio para la Aplicación

```bash
cd ~
mkdir -p apps
cd apps
```

### 4.2 Clonar el Repositorio

**Opción A: Desde GitHub (público o privado con token)**

```bash
git clone https://github.com/vlorcap1/juane_2.git
cd juane_2
```

**Opción B: Si el repo es privado, usa un Personal Access Token:**

```bash
git clone https://TU_TOKEN@github.com/vlorcap1/juane_2.git
cd juane_2
```

**Opción C: Transferir archivos manualmente con SCP**

Desde tu máquina local (Windows PowerShell):
```powershell
scp -r C:\Users\river\Desktop\juane_2 seremis@TU_IP:~/apps/
```

### 4.3 Instalar Dependencias del Proyecto

```bash
cd ~/apps/juane_2
npm install
```

### 4.4 Probar que la Aplicación Funciona

```bash
npm start
```

Verifica en el navegador: `http://TU_IP:3000`

Si funciona, presiona `Ctrl+C` para detener el servidor.

---

## 5. Configuración de Nginx como Reverse Proxy

### 5.1 Crear Archivo de Configuración

```bash
sudo nano /etc/nginx/sites-available/seremis
```

### 5.2 Pegar la Siguiente Configuración

**Sin dominio (usando solo IP):**

```nginx
server {
    listen 80;
    server_name TU_IP_DEL_DROPLET;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Con dominio (ej: seremis.tudominio.cl):**

```nginx
server {
    listen 80;
    server_name seremis.tudominio.cl www.seremis.tudominio.cl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Guarda y cierra: `Ctrl+X` → `Y` → `Enter`

### 5.3 Habilitar el Sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/seremis /etc/nginx/sites-enabled/

# Remover configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 6. Configuración de SSL con Let's Encrypt

**⚠️ IMPORTANTE:** Solo puedes hacer esto si tienes un **dominio apuntando a tu IP**.

### 6.1 Configurar DNS

En tu proveedor de dominio (ej: NIC Chile, GoDaddy, Cloudflare):

1. Crea un registro **A** apuntando a la IP del droplet:
   ```
   Tipo: A
   Name: seremis (o @)
   Value: TU_IP_DEL_DROPLET
   TTL: 3600
   ```

2. Espera 5-15 minutos para que se propague el DNS.

3. Verifica con:
   ```bash
   nslookup seremis.tudominio.cl
   ```

### 6.2 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.3 Obtener Certificado SSL

```bash
sudo certbot --nginx -d seremis.tudominio.cl -d www.seremis.tudominio.cl
```

**Responde:**
- Email: `tu@email.com`
- Términos: `Y`
- Compartir email: `N` o `Y`
- Redirect HTTP a HTTPS: `2` (Sí, recomendado)

### 6.4 Renovación Automática

Certbot instala automáticamente un cronjob. Verifica con:

```bash
sudo systemctl status certbot.timer
```

Prueba la renovación:
```bash
sudo certbot renew --dry-run
```

---

## 7. Configuración de PM2 para Producción

### 7.1 Iniciar la Aplicación con PM2

```bash
cd ~/apps/juane_2
pm2 start server.js --name seremis-maule
```

### 7.2 Configurar Inicio Automático al Reiniciar el Servidor

```bash
pm2 startup systemd
```

Copia y ejecuta el comando que te muestre (algo como `sudo env PATH=... pm2 startup systemd -u seremis --hp /home/seremis`), luego:

```bash
pm2 save
```

### 7.3 Comandos Útiles de PM2

```bash
# Ver estado de procesos
pm2 status

# Ver logs en tiempo real
pm2 logs seremis-maule

# Ver logs solo de errores
pm2 logs seremis-maule --err

# Reiniciar la aplicación
pm2 restart seremis-maule

# Detener la aplicación
pm2 stop seremis-maule

# Ver uso de recursos
pm2 monit

# Ver información detallada
pm2 info seremis-maule
```

### 7.4 Configurar Variables de Entorno

Si necesitas cambiar el puerto u otras configuraciones:

```bash
nano ~/apps/juane_2/ecosystem.config.js
```

Pega esto:

```javascript
module.exports = {
  apps: [{
    name: 'seremis-maule',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Luego reinicia con:

```bash
pm2 delete seremis-maule
pm2 start ecosystem.config.js
pm2 save
```

---

## 8. Opción Alternativa: Usar CyberPanel

CyberPanel es un panel de control con OpenLiteSpeed (servidor web más rápido que Nginx) y gestión visual.

### 8.1 Instalación de CyberPanel

**⚠️ ADVERTENCIA:** Si instalas CyberPanel en un droplet nuevo, NO instales Nginx primero. CyberPanel incluye su propio servidor web.

**En un Droplet FRESCO (sin Nginx):**

```bash
# Descargar e instalar CyberPanel
wget -O installer.sh https://cyberpanel.net/install.sh
chmod +x installer.sh
sudo ./installer.sh
```

**Durante la instalación:**
- Selecciona: `1` (Install CyberPanel with OpenLiteSpeed)
- Full installation: `Y`
- Remote MySQL: `N`
- Password: Ingresa una contraseña segura para el admin
- Memcached: `Y`
- Redis: `Y`

Espera 15-30 minutos.

### 8.2 Acceder a CyberPanel

Una vez instalado, accede a: `https://TU_IP:8090`

- Usuario: `admin`
- Contraseña: la que configuraste

### 8.3 Crear un Sitio Web

1. **Websites** → **Create Website**
   - Dominio: `seremis.tudominio.cl` (o usa la IP)
   - Email: tu email
   - Package: Default
   - PHP: Ninguna (es Node.js)

2. **SSL** → **Hostname SSL** o **Issue SSL** (con Let's Encrypt)

### 8.4 Configurar Reverse Proxy en CyberPanel

1. Ve a **Websites** → **List Websites**
2. Selecciona tu sitio → **Manage** → **vHost Conf**
3. Edita la configuración:

```apache
virtualhost *:443 {
    serverName seremis.tudominio.cl
    
    proxyPass / http://localhost:3000/

    # SSL configs...
}
```

4. Guarda y reinicia OpenLiteSpeed.

### 8.5 Iniciar la App con PM2 (igual que antes)

```bash
cd ~/apps/juane_2
pm2 start server.js --name seremis-maule
pm2 startup
pm2 save
```

---

## 9. Mantenimiento y Troubleshooting

### 9.1 Actualizar la Aplicación

```bash
cd ~/apps/juane_2
git pull origin main  # o la rama que uses
npm install
pm2 restart seremis-maule
```

### 9.2 Ver Logs de la Aplicación

```bash
pm2 logs seremis-maule --lines 100
```

### 9.3 Ver Logs de Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 9.4 Reiniciar Servicios

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar la aplicación
pm2 restart seremis-maule

# Reiniciar todo PM2
pm2 restart all
```

### 9.5 Verificar Estado de Servicios

```bash
# Estado de Nginx
sudo systemctl status nginx

# Estado de PM2
pm2 status

# Uso de disco
df -h

# Uso de memoria
free -h

# Procesos en ejecución
ps aux | grep node
```

### 9.6 Backup de la Base de Datos

```bash
# Crear directorio de backups
mkdir -p ~/backups

# Backup manual
cp ~/apps/juane_2/seremis.db ~/backups/seremis-$(date +%Y%m%d-%H%M%S).db

# Backup automático diario (crontab)
crontab -e
```

Agrega esta línea al final:
```
0 3 * * * cp ~/apps/juane_2/seremis.db ~/backups/seremis-$(date +\%Y\%m\%d).db
```

Esto hará un backup cada día a las 3 AM.

### 9.7 Problemas Comunes

#### ❌ Error: "Cannot connect to server"

**Solución:**
```bash
# Verificar que PM2 esté corriendo
pm2 status

# Verificar que el puerto 3000 esté escuchando
sudo netstat -tlnp | grep 3000

# Reiniciar la aplicación
pm2 restart seremis-maule
```

#### ❌ Error: "502 Bad Gateway" en Nginx

**Solución:**
```bash
# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Asegurarse de que la app esté corriendo
pm2 status

# Reiniciar Nginx y la app
sudo systemctl restart nginx
pm2 restart seremis-maule
```

#### ❌ Error: "Permission denied" en escritura de base de datos

**Solución:**
```bash
cd ~/apps/juane_2
chmod 664 seremis.db
chmod 775 .
```

#### ❌ SSL no funciona / "Your connection is not private"

**Causas:**
1. El dominio no apunta correctamente a la IP del droplet
2. Certbot no se ejecutó correctamente
3. Nginx no se recargó después de instalar el certificado

**Solución:**
```bash
# Verificar DNS
nslookup tudominio.cl

# Reinstalar certificado
sudo certbot --nginx -d tudominio.cl --force-renewal

# Recargar Nginx
sudo systemctl reload nginx
```

---

## 10. Optimizaciones Adicionales

### 10.1 Configurar Swap (para droplets con poca RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 10.2 Habilitar Compresión en Nginx

Edita la configuración de Nginx:

```bash
sudo nano /etc/nginx/nginx.conf
```

Descomenta o agrega en la sección `http`:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
```

Reinicia Nginx:
```bash
sudo systemctl restart nginx
```

### 10.3 Monitoreo con PM2 Plus (Opcional)

```bash
pm2 plus
```

Sigue las instrucciones para vincular tu servidor a [PM2 Plus](https://app.pm2.io/) y tener monitoreo en tiempo real.

---

## 📞 Soporte y Recursos

- **DigitalOcean Docs:** https://docs.digitalocean.com
- **PM2 Docs:** https://pm2.keymetrics.io/docs
- **Nginx Docs:** https://nginx.org/en/docs
- **Let's Encrypt:** https://letsencrypt.org/getting-started
- **CyberPanel Docs:** https://cyberpanel.net/docs

---

## ✅ Checklist Final

Antes de considerar el deployment completo, verifica:

- [ ] El droplet está funcionando y accesible por SSH
- [ ] Node.js y npm están instalados
- [ ] La aplicación corre localmente con `npm start`
- [ ] Nginx está instalado y configurado como reverse proxy
- [ ] La aplicación es accesible desde `http://TU_IP` o `http://tu-dominio.cl`
- [ ] PM2 está gestionando la aplicación
- [ ] PM2 está configurado para iniciar automáticamente al reiniciar el servidor
- [ ] SSL está configurado si tienes un dominio
- [ ] Los backups automáticos están configurados
- [ ] El firewall (UFW) está habilitado y configurado correctamente
- [ ] Has probado reiniciar el servidor (`sudo reboot`) y verificar que todo vuelve a funcionar

---

**🎉 ¡Felicitaciones! Tu aplicación SEREMIS Maule está ahora en producción en DigitalOcean.**

Si tienes dudas o problemas durante el deployment, revisa la sección de troubleshooting o consulta los logs correspondientes.
