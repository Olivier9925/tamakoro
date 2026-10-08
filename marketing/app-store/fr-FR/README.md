# Tamakoro — En-tête et résultats de recherche App Store

Deux exports uniquement, adaptés aux placements natifs :

| Fichier | Placement | Dimensions |
| --- | --- | --- |
| `tamakoro-entete-3840x1646.png` | En-tête de la page produit, 21:9 | 3840 × 1646 px |
| `tamakoro-recherche-3840x2560.png` | Résultats de recherche, 3:2 | 3840 × 2560 px |

PNG RGB en sRGB, sans canal alpha ni transparence. Le titre et le personnage
restent entièrement visibles. Les pixels sont conservés par un agrandissement
au plus proche voisin ; les dimensions des PNG générés par l’outil ne sont pas
les dimensions finales, vérifiées dans `verification.json`.

La création utilise l’outil intégré imagegen, avec l’icône actuelle
`assets/images/tamakoro-icon-v2.png` comme référence de personnage et de style.
L’en-tête est une adaptation panoramique de l’illustration initiale. Le visuel de
recherche reprend le personnage à droite et le message promotionnel à gauche :
« Adopte ton petit compagnon. Fais-le grandir. ». Ce sont
des illustrations promotionnelles, et non des captures de l’interface du jeu.
Les prompts exacts sont conservés dans `prompts.md`.

Dans App Store Connect, pour la localisation française, charger l’en-tête dans
« En-tête » et le second fichier dans « Résultats de recherche ». Vérifier le
rendu avec « Aperçu » sur iPhone et iPad avant la soumission. Aucun fichier n’a
été chargé ou publié automatiquement.

Le ZIP `tamakoro-app-store-fr-FR.zip` contient uniquement les deux PNG.

Références Apple consultées le 8 octobre 2026 :

- [Bonnes pratiques des ressources App Store](https://developer.apple.com/app-store/asset-best-practices/)
- [Spécifications des ressources créatives](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications)
