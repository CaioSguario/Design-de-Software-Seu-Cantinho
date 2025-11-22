#Usar a imagem oficial do Nginx
FROM nginx:alpine

# Remover arquivos padrões do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar seus arquivos HTML para a pasta pública do Nginx
COPY ./src/ /usr/share/nginx/html

# Expor a porta padrão do Nginx
EXPOSE 80

# Comando padrão (já incluso na imagem base)
CMD ["nginx", "-g", "daemon off;"]

