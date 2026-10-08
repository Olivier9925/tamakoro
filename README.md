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

La créature dispose de cinq poses SVG générées en code : repos, inspiration,
regard à gauche, regard à droite et clignement. Reanimated alterne ces sprites
sans interpolation, sur un cycle de huit secondes. Pendant le sommeil, seuls deux
sprites aux yeux fermés alternent doucement sur quatre secondes. L’animation se
met en pause en arrière-plan et reste fixe si la réduction des animations est activée.

L’écran de soins adapte la hauteur de l’incubateur à l’espace disponible. Les cinq
jauges fluorescentes et les cinq touches de soin sont regroupées sur deux rangées
compactes. Les touches ont une base en relief et s’enfoncent à l’appui. Le défilement
reste disponible pour les grands textes d’accessibilité et les messages d’erreur.

### Règles de départ à ajuster

Toutes les jauges vont de 0 à 100 ; une valeur haute signifie que le besoin est satisfait
(« Satiété » évite l’ambiguïté d’une jauge de faim). Par heure : satiété −4, énergie −3,
hygiène −2, humeur −2. Pendant le sommeil : énergie +18 et humeur −1.
Si satiété, hygiène ou humeur descend sous 20, la santé baisse de 2 par heure ;
sinon elle remonte de 1. La santé ne descend pas sous 25 : aucune perte irréversible.
Les soins et leurs effets sont expliqués dans l’écran. Le sommeil dure jusqu’au réveil
manuel. Le temps est calculé à partir de l’horodatage sauvegardé, sans exécution en arrière-plan.
Un recul de l’horloge ne fait pas reculer l’état de la créature.

Après l’ajout d’AsyncStorage, un ancien development build doit être recompilé pour
inclure le module natif. Expo Go compatible avec le SDK inclut ce module.

Notion reste la source de vérité pour le périmètre et les priorités :
[Tamakoro — User Stories](https://app.notion.com/p/22d40c7828eb4307a0d5d07c3f851079?pvs=21).
