# Tamakoro – Virtual Pet

Application Expo, React Native et TypeScript pour iOS et Android.

## Démarrage

Depuis ce dossier, avec Node.js 22.13 ou plus récent et npm :

```sh
npm ci
npm start
```

Scanner le QR code avec une version d’Expo Go compatible avec le SDK du projet.
`npm run ios` ouvre le simulateur iOS (Xcode requis), `npm run android` ouvre
l’émulateur Android (Android Studio requis), et `npm run web` lance la version web.

## Vérification

```sh
npm run typecheck
npm run lint
npm test
npx expo install --check
```

## Builds EAS et GitHub

`eas.json` se trouve à la racine de ce dépôt, à côté de `package.json`.
Les profils disponibles sont `development` (client de développement pour appareil),
`simulator` (client iOS pour simulateur), `preview` (distribution interne sans
outils de développement) et `production` (App Store/TestFlight ou Google Play).
Ils utilisent Node.js 22.13.0 et les images EAS `latest`, explicitement configurées
pour les builds GitHub. Les numéros de build de production sont gérés et incrémentés
par EAS. Les rappels sont locaux : aucune configuration de notifications push
distantes n’est demandée.

Pour lancer depuis GitHub, commiter et pousser `eas.json` dans la branche choisie.
Dans les réglages GitHub du projet Expo, laisser « Base directory » vide : le
dossier local s’appelle `app/`, mais son contenu constitue la racine du dépôt
`Olivier9925/tamakoro`. Choisir ensuite le profil voulu, par exemple `production`
pour iOS/TestFlight. Un build ne soumet pas automatiquement l’application aux stores.

Expo demande également un premier build EAS réussi depuis la machine locale pour
chaque plateforme afin d’initialiser le projet et ses éléments de signature.
Utiliser le projet Expo existant lors de cette configuration ; ne pas créer un doublon.
`app.json` est associé au projet existant `@olivier9925/tamakoro-virtual-pet` :
le champ `owner`, le `slug` et `extra.eas.projectId` correspondent à ce projet.
Ces champs doivent être commités et poussés dans la branche utilisée par Expo.
Ils évitent l’erreur « EAS project not configured » en mode non interactif.
`eas project:info` permet de vérifier cette association sans lancer de build.
Android nécessite son identifiant d’application `android.package` avant son premier build.
Les identifiants de projet et de signature se configurent avec le compte propriétaire ;
aucune valeur ni aucun secret ne sont inventés dans le dépôt.

Si le build GitHub échoue avec « Credentials are not set up », initialiser la
signature depuis un terminal interactif, dans ce dossier :

```sh
npm run credentials:ios
```

Cette commande configure les credentials iOS du profil `production`, sans lancer
de build ni de soumission. Se connecter à Apple Developer lorsqu’EAS le propose
(mot de passe et validation à deux facteurs à saisir directement dans le terminal),
sélectionner l’équipe `F8JXH55Q48`, réutiliser un certificat de distribution valide
si disponible et laisser EAS créer le profil App Store pour
`com.olivier9925.tamakoro`. Les éléments de signature sont conservés sur EAS.
Le message « Distribution Certificate is not validated for non-interactive builds »
ne prouve pas à lui seul que le certificat est invalide : le blocage est l’absence
d’un ensemble de credentials prêt à l’emploi.

Lancer ensuite un premier build EAS depuis ce terminal avec
`npm run build:prod -- --platform ios`, puis utiliser les builds GitHub.
Il s’agit d’un build cloud initié depuis la machine, distinct du build Xcode local
`npm run ios`. Le profil `production` cible App Store/TestFlight ; le profil
`simulator` ne remplace pas sa configuration de signature.

`ios.infoPlist.ITSAppUsesNonExemptEncryption` vaut `false` pour le MVP actuel,
qui n’implémente pas de chiffrement non exempt. Ce champ supprime la question
manuelle de conformité au chiffrement lors du traitement TestFlight.
Réévaluer cette déclaration si une fonctionnalité de chiffrement est ajoutée.
L’absence de variables d’environnement EAS est normale pour ce MVP hors ligne,
et l’avertissement Node.js `punycode` n’est pas la cause de l’échec de signature.

La section `submit.production.ios` d’`eas.json` configure uniquement l’envoi vers
App Store Connect/TestFlight. `appleId`, `appleTeamId` et `ascAppId` ne remplacent
pas `extra.eas.projectId`. Lors de la configuration de la soumission, utiliser
l’identifiant numérique réel de la fiche App Store Connect pour `ascAppId`, jamais
une valeur masquée comme `***`. Un simple build GitHub ne nécessite pas ce bloc.

Voir les guides officiels : [configuration EAS](https://docs.expo.dev/build/eas-json/)
et [builds depuis GitHub](https://docs.expo.dev/build/building-from-github/).

## Pages publiques et confidentialité

`index.html` contient la politique de confidentialité de Tamakoro, adaptée à la
version mobile hors ligne : sauvegarde et préférences locales, rappels facultatifs,
absence de suivi intégré, assistance par e-mail et hébergement du site.
`assist.html` est la page d’assistance ; les deux pages sont reliées entre elles.
Elles ne chargent aucune ressource distante et ne nécessitent pas de build Expo.

Pour les publier comme le site CheckIt, configurer GitHub Pages sur le dépôt
`Olivier9925/tamakoro`, avec la branche `main` et le dossier `/ (root)` comme source,
puis commiter et pousser ces fichiers. Après publication, les URLs attendues sont
`https://olivier9925.github.io/tamakoro/` pour la confidentialité et
`https://olivier9925.github.io/tamakoro/assist.html` pour l’assistance.
Vérifier que ces adresses sont accessibles avant de les saisir dans App Store Connect.
La déclaration Apple « Données non collectées » est cohérente avec le code mobile
actuel, qui ne transmet pas de données de jeu au développeur ; la réévaluer lors
de tout ajout de service ou SDK distant. La politique devra aussi être accessible
depuis l’app avant sa soumission. Aucun déploiement ou changement App Store Connect
n’est effectué par la création de ces pages.

Références : [confidentialité Apple](https://developer.apple.com/app-store/app-privacy-details/)
et [hébergement GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Organisation de l’application

Le démarrage affiche l’incubateur pixelisé plein écran et le titre central Tamakoro.
Les SVG et PNG `assets/images/tamakoro-splash*` reprennent les dessins du jeu ;
`node scripts/generate-splash.cjs` régénère les SVG. Pour les PNG, fournir le chemin
d’un module Sharp installé avec `SHARP_MODULE=/chemin/vers/sharp` à la même commande.
Le PNG portrait est rasterisé à 360 × 780 puis agrandi sans lissage.

Sur iOS, le plugin `expo-splash-screen` utilise actuellement l’option native
`enableFullScreenImage_legacy` (à remplacer lorsqu’Expo la retirera). Android affiche
d’abord le logo sur fond bleu nuit, conformément à son écran système, puis le même
incubateur plein écran. Le calque React est visible environ 1,1 seconde une fois
l’image chargée ; les routes et la sauvegarde se chargent derrière. Il ne se rejoue
pas à chaque retour au premier plan. Le mode clair et sombre partagent ce visuel.
Recompiler après modification du splash natif : `npm run prebuild:ios`, puis
`npm run ios:release` pour une vérification fidèle (ou équivalents Android).
Expo Go et les development builds ne reproduisent pas entièrement le splash natif,
voir [la documentation du SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/).

- `src/app/` : routes Expo Router, adoption et écran de soins.
- `src/components/` : sprite pixel art provisoire et palettes.
- `src/game/` : règles déterministes et sauvegarde AsyncStorage versionnée.
- `src/hooks/` : chargement, soins, reprise et sauvegardes sérialisées.
- `tests/` : tests du moteur avec le runner intégré de Node.js.
- `assets/` : ressources du modèle Expo, à remplacer par les visuels Tamakoro.
- `app.json` : identité et configuration de l’application.

La première tranche jouable couvre US-001 à US-005 : adoption avec nom et couleur,
cinq besoins, nourrir, hydrater, jouer, nettoyer, dormir/réveiller, sauvegarde locale
et calcul du temps écoulé au retour. Les erreurs de lecture préservent la sauvegarde ;
les erreurs d’écriture proposent une nouvelle tentative. Le MVP reste hors ligne,
sans compte ni backend. Les ressources artistiques finales restent à intégrer.

Sur iOS, l’écran d’adoption ajuste automatiquement le défilement à l’ouverture
du clavier pour garder le nom saisi visible. Faire défiler ferme le clavier.

Le décor de l’incubateur est généré en SVG par `src/components/incubator-art.ts`
et affiché avec `expo-image`, déjà installé. Caméra, batterie, puces, nappes cuivrées
et chambre lumineuse reprennent les références de `../sources/`. La lumière devient
bleue pendant le sommeil. Le décor fonctionne hors ligne, sans nouvelle dépendance,
et s’adapte à la largeur disponible. Le sprite de la créature reste provisoire ;
les ressources finales restent à intégrer.

Des impulsions lumineuses parcourent les huit pistes orange, avec des départs
décalés. Le ventilateur tourne par crans de 15 degrés. Les lumières sont découpées
à la largeur exacte des pistes, en excluant les composants. L’animation utilise huit
calques SVG précalculés, alternés par Reanimated toutes les 200 ms (400 ms pendant
le sommeil, avec une lumière atténuée). Ils se mettent en pause en arrière-plan
et disparaissent en mode de réduction des animations, laissant le décor fixe.

La créature grandit pendant 90 jours : bébé à la naissance, petite pousse à 15 jours,
enfant à 30 jours, juvénile à 45 jours, adolescent à 60 jours, jeune adulte à 75 jours
et adulte à 90 jours. L’âge provient des horodatages existants, même hors ligne,
sans changer le format des sauvegardes. Les besoins et le sommeil ne bloquent pas
la croissance. L’écran affiche le stade et le délai avant la prochaine évolution ;
un message annonce les changements constatés, y compris au retour après une absence.
La croissance s’arrête au décès.

Chaque forme dispose de cinq poses SVG générées en code : repos, inspiration,
regard à gauche, regard à droite et clignement. Reanimated alterne ces sprites
sans interpolation, sur un cycle de huit secondes. Pendant le sommeil, seuls deux
sprites aux yeux fermés alternent doucement sur quatre secondes. L’animation se
met en pause en arrière-plan et reste fixe si la réduction des animations est activée.
Les sept silhouettes sont dessinées en SVG sur un canevas de 160 × 160 unités :
contours courbes, ombres douces, iris avec reflets, joues et feuilles nervurées.
La taille, les feuilles latérales et la couronne se développent avec l’âge ; un
collier apparaît à l’adolescence et un bourgeon distingue les formes matures.
Les pieds gardent un ancrage commun pendant la respiration. L’affichage s’adapte
sans arrondi à la place disponible dans l’incubateur. Chaque stade et chaque palette
ont leurs propres sprites animés, générés et mis en cache au premier affichage.

`SHARP_MODULE=/chemin/vers/sharp node scripts/preview-pet-sprites.cjs` crée un
aperçu HTML autonome dans `docs/pet-sprites/` et rasterise les 147 poses pour
vérifier la transparence, l’absence de rognage et l’ancrage des pieds.

L’écran de soins adapte la hauteur de l’incubateur à l’espace disponible. Les cinq
jauges fluorescentes et les cinq touches de soin sont regroupées sur deux rangées
compactes. Les touches ont une base en relief et s’enfoncent à l’appui. Le défilement
reste disponible pour les grands textes d’accessibilité et les messages d’erreur.
Le défilement est limité au contenu qui dépasse l’écran, sans rebond ni effet
de dépassement lorsque tout tient dans la hauteur disponible.

L’en-tête reprend une plaque électronique avec un titre pixel art dessiné en SVG.
Le nom de la créature utilise la police monospace du système (Menlo sur iOS),
avec un préfixe de terminal. Le fond bleu nuit est généré en SVG : grille légère,
points et quelques pistes périphériques, sans animation ni ressource distante.
Les messages de soin et de sauvegarde sont regroupés dans un cartouche de terminal
qui partage le fond, la bordure en relief et la police du cartouche du nom.

Le bouton « ? » de l’en-tête ouvre à tout moment un guide hors ligne, avant
l’adoption comme pendant la partie ou sur l’écran souvenir. Il explique les effets
des soins, le réveil manuel ou automatique à énergie pleine, les formes tous les 15 jours jusqu’à 90 jours,
les absences et le décès à santé zéro. La route modale `/help` conserve l’écran
de jeu en place ; « × » ferme l’aide, ou revient à l’accueil si elle a été ouverte
directement. Le guide défile sur les petits écrans et avec des textes agrandis.

La roue dentée à gauche du titre ouvre l’écran dédié « Paramètres » (`/settings`).
Le bouton « ? » à droite reste réservé au guide. Les deux écrans gardent le style
terminal, conservent la partie en place et se ferment avec « × » ; une ouverture
directe revient à l’accueil. Les touches de l’en-tête font au moins 44 × 44 points.

L’encart « Rappels » des paramètres propose un rappel quotidien local, désactivé par
défaut, à 19 h (horaire configurable avec le sélecteur natif). L’autorisation
du téléphone est demandée uniquement lorsque le joueur active l’option. Un refus
laisse le rappel désactivé et donne accès aux réglages du téléphone. Une révocation
ultérieure suspend le rappel ; l’autorisation est revérifiée au retour dans l’app,
sans nouvelle demande automatique. Le bouton de test programme un rappel à 5 secondes.
Un appui sur une notification Tamakoro ouvre la partie.

`expo-notifications` programme le rappel sur iOS et Android, sans compte, jeton
push, serveur ni tâche de jeu en arrière-plan. Les préférences sont validées et
stockées séparément sous `tamakoro.reminders.v1`. Les opérations sont sérialisées ;
l’identifiant quotidien fixe évite les doublons. Changer l’horaire remplace le rappel,
et désactiver l’option annule aussi le test en attente. Les échecs de sauvegarde
restaurent autant que possible l’ancien horaire et affichent une erreur.
Une sauvegarde de réglages illisible est préservée et bloque toute réécriture.

Le rappel est suspendu sans compagnon vivant et dès qu’un décès est constaté par
l’app ; une nouvelle adoption le reprend si l’option était activée. Pendant une
absence, le système affiche le message déjà programmé : il ne recalcule pas les
jauges ni le décès. Le rappel quotidien n’est donc pas une alerte de santé.
L’horaire suit l’heure locale du téléphone ; modes silencieux, concentration et
économie d’énergie peuvent affecter l’affichage ou le délai. Android utilise une
alarme approximative si l’autorisation système des alarmes exactes n’est pas accordée ;
le projet ne demande pas cette autorisation supplémentaire. Sur le web, l’encart
indique que les rappels nécessitent l’app mobile et ses contrôles sont désactivés.

Après l’ajout d’`expo-notifications`, recompiler tout development build existant
avec `npm run ios` ou `npm run android` pour intégrer le module natif. Les rappels
locaux peuvent aussi être testés dans Expo Go compatible avec le SDK 57.
Si le module natif manque dans le client installé, l’app reste jouable et l’encart
indique la recompilation nécessaire, sans importer le module manquant.

### Règles de départ à ajuster

Toutes les jauges vont de 0 à 100 ; une valeur haute signifie que le besoin est satisfait
(« Satiété » évite l’ambiguïté d’une jauge de faim). Par heure : satiété −4, énergie −3,
hygiène −2, humeur −2. Pendant le sommeil : énergie +18 et humeur −1.
Si satiété, hygiène ou humeur descend sous 20, la santé baisse de 2 par heure ;
sinon elle remonte de 1. La santé peut descendre jusqu’à zéro : le Tamakoro décède
alors, même durant une absence ou son sommeil. La perte reste de 2/h lorsqu’il y a
plusieurs besoins critiques. L’énergie seule ne provoque pas une perte de santé.
Sans aucun soin, un nouveau compagnon décède après 66 h 15 min. L’instant du décès
est calculé précisément, indépendamment du nombre de rafraîchissements ; son état
et sa croissance sont ensuite figés, et aucun soin ne peut le ressusciter.
Le décès est enregistré immédiatement. L’incubateur devient un souvenir avec la
date du décès ; une nouvelle adoption nécessite une validation explicite avant de
remplacer la partie. Le format v1 et la clé de sauvegarde existants sont conservés :
une santé à zéro suffit à identifier cet état. Cette règle de mort remplace, à la
demande du joueur, la protection initiale du MVP contre les pertes irréversibles.
Les fiches des compagnons décédés sont conservées séparément dans le mémorial local,
accessible depuis les paramètres. Elles gardent leur apparence, leur stade, leur âge,
leurs dates et leurs dernières jauges ; les anciennes parties déjà décédées sont
ajoutées au mémorial au prochain lancement.

Les alertes commencent sous 25 pour satiété, énergie et hygiène, sous 30 pour
humeur et sous 40 pour santé. Les jauges deviennent rouges sous 20 (sous 10 pour
énergie), et le cartouche explique les causes de la baisse de santé et les soins.
Les soins et leurs effets sont expliqués dans l’écran. Le sommeil rend 18 points
d’énergie par heure et se termine automatiquement à 100 ; le joueur peut aussi
réveiller son Tamakoro plus tôt. Le temps est calculé à partir de l’horodatage
sauvegardé, sans exécution en arrière-plan.
Un recul de l’horloge ne fait pas reculer l’état de la créature.

Chaque soin éveillé consomme aussi de l’énergie : nourrir −4, hydrater −3,
nettoyer −6 et jouer −12. Une action n’est pas exécutée si le Tamakoro n’a pas
l’énergie nécessaire ; dormir recharge la jauge à raison de 18 points par heure.

Après l’ajout d’AsyncStorage, un ancien development build doit être recompilé pour
inclure le module natif. Expo Go compatible avec le SDK inclut ce module.

Notion reste la source de vérité pour le périmètre et les priorités :
[Tamakoro — User Stories](https://app.notion.com/p/22d40c7828eb4307a0d5d07c3f851079?pvs=21).

### Langues

L’interface est disponible en français et en anglais. Le mode automatique utilise
la première langue du téléphone : français si son code est `fr`, anglais pour toute
autre langue. Le choix automatique ou manuel est enregistré localement sous
`tamakoro.language.v1`. Le changement de langue s’applique immédiatement aux écrans,
aux messages du jeu et aux rappels locaux ; aucune traduction distante n’est utilisée.
`expo-localization` fournit la langue du téléphone. Après son ajout, reconstruire le
client natif avec `npm run ios` ou `npm run android` avant d’utiliser cette version
dans un development build existant.
