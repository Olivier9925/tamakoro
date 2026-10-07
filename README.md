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
npx expo install --check
```

## Organisation

- `src/app/` : routes Expo Router et écran d’accueil initial.
- `assets/` : ressources du modèle Expo, à remplacer par les visuels Tamakoro.
- `app.json` : identité et configuration de l’application.

Cette initialisation contient uniquement un écran d’accueil. La créature, les soins,
la sauvegarde locale et la gestion du temps restent à implémenter selon les User Stories.
Le MVP est prévu hors ligne, sans compte ni backend.

Notion reste la source de vérité pour le périmètre et les priorités :
[Tamakoro — User Stories](https://app.notion.com/p/22d40c7828eb4307a0d5d07c3f851079?pvs=21).
