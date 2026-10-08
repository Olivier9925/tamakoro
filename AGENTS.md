# Instructions Codex — Application Tamakoro

## Projet et périmètre

Tamakoro est une application de compagnon virtuel construite avec Expo, React Native et TypeScript, destinée à iOS et Android. Le MVP fonctionne hors ligne, sans compte ni backend.

- Répondre en français, avec des explications courtes et concrètes. Conserver les identifiants de code en anglais et les textes de l’interface en français.
- Lire le code concerné avant de proposer une modification : le README peut être en retard sur l’implémentation.
- Les User Stories Notion liées dans `README.md` définissent le périmètre et les priorités. Les consulter lorsque la tâche en dépend et que l’accès est disponible. Si elles sont inaccessibles, le signaler et s’appuyer sur la demande explicite et les documents locaux ; ne pas inventer leurs critères d’acceptation.
- Ne pas ajouter de compte, backend, monétisation, télémétrie ou service distant sans demande explicite.
- Avancer sur les choix techniques courants sans demander une confirmation à chaque étape. Demander une précision seulement lorsqu’un choix produit important ne peut pas être déduit du contexte.

## Organisation du code

- `src/app/` : écrans et navigation Expo Router ; `_layout.tsx` définit les navigateurs.
- `src/components/` : composants d’interface réutilisables.
- `src/game/pet.ts` : modèle de la créature, besoins, soins et évolution dans le temps.
- `src/game/storage.ts` : persistance locale avec AsyncStorage.
- `assets/` : ressources intégrées à l’application.
- `../sources/` : références graphiques originales.
- `app.json` : identité, configuration Expo et plugins natifs.

Garder les composants, hooks et utilitaires hors de `src/app/`. Séparer la logique du jeu, le stockage et l’affichage. Utiliser l’alias `@/` prévu par `tsconfig.json`. Préserver le mode TypeScript strict et éviter `any` ou les suppressions d’erreurs sans justification.

## Logique du compagnon et sauvegarde

- Garder la logique du jeu indépendante de React et d’AsyncStorage, avec des fonctions pures lorsque possible.
- Passer explicitement l’heure aux fonctions du jeu, comme dans le code existant, pour rendre les scénarios reproductibles.
- Calculer le temps écoulé à partir des horodatages sauvegardés. Ne pas dépendre uniquement des timers, qui peuvent être suspendus lorsque l’application passe en arrière-plan.
- Préserver les bornes des besoins, la cohérence des horodatages et un résultat indépendant de la fréquence de rafraîchissement.
- Valider les données chargées. Une sauvegarde illisible ne doit pas être effacée ou remplacée silencieusement.
- Si le format de sauvegarde change, prévoir le versionnement et la migration des données existantes. Ne pas changer une clé de stockage sans gérer les anciennes données.
- Préserver les règles et valeurs existantes sauf si la tâche demande explicitement de les modifier.

## Interface et direction artistique

- Conserver une identité de compagnon attachant et de pixel art, cohérente avec les références de `../sources/` et les composants existants.
- Avant de reproduire ou de modifier un visuel, inspecter les références concernées. Préserver les originaux et placer les ressources destinées à l’application dans `assets/`.
- Concevoir d’abord pour un téléphone en portrait, avec prise en compte des zones sûres, des petits écrans et des différences entre iOS et Android.
- Prévoir des libellés accessibles, des boutons faciles à toucher, un contraste lisible et des retours compréhensibles pour les actions et les erreurs.
- Pour un changement visuel, vérifier le rendu sur les plateformes disponibles et indiquer celles qui n’ont pas été vérifiées.

## Expo et dépendances

- Vérifier la version d’Expo dans `package.json` avant d’utiliser une API Expo, React Native ou EAS. Consulter la documentation adaptée au SDK installé : `https://docs.expo.dev/versions/v<major>.0.0/`.
- Pour les autres fonctionnalités Expo, utiliser `https://docs.expo.dev/llms.txt` pour trouver la page pertinente. Ne pas supposer qu’une API mémorisée est encore valable.
- Le projet utilise npm et `package-lock.json`. Conserver ce gestionnaire et son fichier de verrouillage.
- Installer les dépendances d’application avec `npx expo install <package>` pour obtenir les versions compatibles avec le SDK. Préférer les modules Expo adaptés et limiter les dépendances supplémentaires.
- Utiliser Expo Router pour la navigation et ses APIs `Link`, `router` et `useLocalSearchParams` lorsque nécessaire.
- Une bibliothèque contenant du code natif peut nécessiter un development build ; vérifier sa compatibilité avec Expo Go avant de recommander celui-ci.
- Privilégier `app.json` et les config plugins pour la configuration native. Vérifier si les dossiers `ios/` et `android/` sont générés ou maintenus manuellement avant de les modifier. Ne pas écraser des ajustements natifs existants avec un prebuild.
- Les builds locaux sont possibles avec les scripts existants ; utiliser EAS lorsque la tâche demande un build cloud, une soumission ou une mise à jour OTA.

## Commandes et vérifications

Exécuter les commandes depuis ce dossier (`app/`). Vérifier les scripts actuels dans `package.json` avant de les utiliser.

```sh
npm ci                     # installer depuis le verrouillage si nécessaire
npm start                  # serveur de développement
npm run web                # aperçu web
npm run ios                # build et lancement iOS local, Xcode requis
npm run android            # build et lancement Android local, outillage Android requis
npm run typecheck          # vérification TypeScript
npm run lint               # vérification ESLint
npx expo install --check   # compatibilité des dépendances
npx expo-doctor            # diagnostic Expo si nécessaire
```

- Après une modification du code ou de la configuration, exécuter `npm run typecheck` et `npm run lint`. Pour une modification uniquement documentaire, relire les consignes et vérifier les chemins et commandes concernés.
- Après un changement de dépendances, vérifier aussi leur compatibilité avec `npx expo install --check`. Ne pas lancer une correction globale de versions sans analyser les changements.
- Pour la logique du jeu ou le stockage, ajouter ou exécuter des tests ciblés sur les comportements modifiés : temps écoulé, sommeil, bornes, chargement invalide ou migration selon la tâche. Choisir un outillage proportionné si aucun outil de test n’est configuré.
- Distinguer les vérifications statiques des essais dans l’application. Ne pas annoncer un test sur appareil ou simulateur s’il n’a pas été effectué.
- Si une vérification est bloquée, indiquer la commande, la cause et ce qui reste à vérifier.

## Manière de travailler

- Vérifier l’état Git avant les modifications et préserver les changements de l’utilisateur, y compris les fichiers non suivis.
- Faire des changements ciblés ; éviter les refontes, renommages et formatages sans rapport avec la tâche.
- Ne jamais exposer de clés, certificats, profils de provisioning ou autres secrets dans les réponses, logs ou fichiers versionnés.
- Les scripts de soumission et d’auto-submit publient vers des services externes : ne les exécuter que si la demande autorise cette publication. Éviter les commandes destructrices telles que `prebuild --clean` sans vérifier et préserver les modifications natives.
- Mettre à jour la documentation lorsqu’un changement affecte le démarrage, l’architecture ou un comportement documenté.
- Terminer par un résumé en français : ce qui a changé, les vérifications effectuées et les éventuelles limites.
