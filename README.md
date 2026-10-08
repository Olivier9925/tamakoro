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

## Organisation

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
sans compte ni backend. Les notifications et les évolutions artistiques restent à faire.

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
Les sept silhouettes partagent un canevas de 32 × 32 pixels, avec une taille,
des nageoires et une couronne qui se développent. Chaque stade et chaque palette
ont leurs propres sprites animés, générés et mis en cache au premier affichage.

L’écran de soins adapte la hauteur de l’incubateur à l’espace disponible. Les cinq
jauges fluorescentes et les cinq touches de soin sont regroupées sur deux rangées
compactes. Les touches ont une base en relief et s’enfoncent à l’appui. Le défilement
reste disponible pour les grands textes d’accessibilité et les messages d’erreur.

L’en-tête reprend une plaque électronique avec un titre pixel art dessiné en SVG.
Le nom de la créature utilise la police monospace du système (Menlo sur iOS),
avec un préfixe de terminal. Le fond bleu nuit est généré en SVG : grille légère,
points et quelques pistes périphériques, sans animation ni ressource distante.
Les messages de soin et de sauvegarde sont regroupés dans un cartouche de terminal
qui partage le fond, la bordure en relief et la police du cartouche du nom.

Le bouton « ? » de l’en-tête ouvre à tout moment un guide hors ligne, avant
l’adoption comme pendant la partie ou sur l’écran souvenir. Il explique les effets
des soins, le réveil manuel, les formes tous les 15 jours jusqu’à 90 jours,
les absences et le décès à santé zéro. La route modale `/help` conserve l’écran
de jeu en place ; « × » ferme l’aide, ou revient à l’accueil si elle a été ouverte
directement. Le guide défile sur les petits écrans et avec des textes agrandis.

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

Les alertes commencent sous 25 pour satiété, énergie et hygiène, sous 30 pour
humeur et sous 40 pour santé. Les jauges deviennent rouges sous 20 (sous 10 pour
énergie), et le cartouche explique les causes de la baisse de santé et les soins.
Les soins et leurs effets sont expliqués dans l’écran. Le sommeil dure jusqu’au réveil
manuel. Le temps est calculé à partir de l’horodatage sauvegardé, sans exécution en arrière-plan.
Un recul de l’horloge ne fait pas reculer l’état de la créature.

Après l’ajout d’AsyncStorage, un ancien development build doit être recompilé pour
inclure le module natif. Expo Go compatible avec le SDK inclut ce module.

Notion reste la source de vérité pour le périmètre et les priorités :
[Tamakoro — User Stories](https://app.notion.com/p/22d40c7828eb4307a0d5d07c3f851079?pvs=21).
