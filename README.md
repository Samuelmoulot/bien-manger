# Restaurant Mobil - Bien Manger

Petit site vitrine responsive avec une carte chargée par le backend et une préparation de commande à poursuivre sur WhatsApp.

## Ouvrir et lancer le site dans Visual Studio Code

1. Installez **Node.js** si votre ordinateur ne le possède pas déjà : https://nodejs.org/ (version LTS).
2. Dans Visual Studio Code, choisissez **Fichier > Ouvrir un dossier…** et sélectionnez le dossier `bien-manger-site`.
3. Ouvrez **Terminal > Nouveau terminal**.
4. Dans le terminal PowerShell de Visual Studio Code, lancez le serveur avec `npm.cmd start`. Cette commande évite le script `npm.ps1` bloqué par certains réglages de sécurité Windows. Si vous utilisez l'invite de commandes Windows (cmd), `npm start` convient aussi.
5. Ouvrez `http://localhost:3000` dans votre navigateur. Pour consulter le site sur un téléphone connecté au même Wi-Fi, ouvrez `http://192.168.1.10:3000` (l'adresse du PC peut changer).
6. Pour arrêter le serveur, revenez au terminal et faites `Ctrl + C`.

Il n’y a aucune bibliothèque à installer avec npm : le serveur utilise les fonctions intégrées de Node.js.

## Où modifier le site ?

- `frontend/index.html` : les grandes zones de la page, comme l’accueil, les menus et les coordonnées.
- `frontend/styles.css` : les couleurs, les polices et la mise en page.
- `frontend/app.js` : les filtres du menu et le parcours de commande.
- `frontend/menu-page.html` : la page de carte affichée séparément pour le petit-déjeuner, les boissons ou le déjeuner/dîner selon le lien choisi.
- `frontend/index.html` : l’accueil et la rubrique qui ouvre le catalogue Canva fourni.
- `data/menu.json` : les plats, leurs descriptions et les prix repris du catalogue.
- `backend/server.js` : le serveur et les adresses `/api/menu` et `/api/commande`.

## Parcours de commande

Les plats peuvent être ajoutés au panier depuis les cartes, puis le panier est ouvert avec son bouton en haut de la page ou dans la barre mobile. Le serveur prépare un message de commande et renvoie un lien WhatsApp prérempli. Le client relit le message puis l'envoie lui-même dans WhatsApp. Le site affiche Wave et Orange Money au numéro du restaurant ; le paiement est effectué dans l'application mobile, il n'est pas encaissé par le site. Les prix affichés comprennent la livraison. Les commandes ne sont pas enregistrées dans une base de données.

Les prix, le téléphone, l’adresse et les contenus de menu sont centralisés dans `data/menu.json`, ce qui facilite leur mise à jour. Les photos du site proviennent du catalogue fourni. Le QR code ouvre directement une conversation WhatsApp avec le numéro du restaurant.
