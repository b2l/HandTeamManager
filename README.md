# ![BSC Logo](http://localhost:3000/public/img/header-s6680651eed.png) Hand Team Manager 
 projet consiste à offrir une véritable solution clé en main au résponsable d'équipe de Handball.
L'idée et de pouvoir facilement se connecter, inviter les membres de son équipe et partager ces combinaison (schéma de jeu) avec eux.

## Objectif technique

- Fonctionner en mode non connecté
- Rafraichissement automatique sur le client si un autre utilisateur ajoute des données
- Utilisation d'un stockage noSQL
- Être indépendant du client, afin de pouvoir en faire un application pour mobile par exemple

## Principe technique (développeur)

L'application est une Single Page App (ou Rich Internet Application).
Côtés server, on aura quasiment qu'une API Rest, qui gérera le stockage des données.

### Client Web
Fonctionnement avec [page](https://github.com/visionmedia/page.js).
L'architecture est la suivante :

<pre>
Router(page) 
    |
    v
Controller <--> Model
 |    ʌ
 v    |
  View   <--> DOM
</pre>

Pour le début d'implémentation, il faut regarder uniquement les fichiers :
- assets/app.js
- assets/controllers/*.js

les templates sont fournits par le serveur dans la page HTML de base (srv/views/index.html)

### Côtés Server

Le server est écrit en nodejs, sans utiliser de Framework "full stack".

#### Rest API

GET /team
GET /team/:team
POST /team/:team
...