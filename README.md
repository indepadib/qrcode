# QR Code Studio

Application React + Vite + Tailwind permettant de générer, personnaliser, sauvegarder et retrouver des QR codes.

## Mode de stockage
Cette version est volontairement simple : pas de backend, pas de Supabase, pas d'authentification.
Les QR codes sont sauvegardés dans le navigateur avec localStorage.

Avantage : ultra simple à déployer.
Limite : les QR sauvegardés restent sur le navigateur utilisé. Pour synchroniser entre plusieurs utilisateurs/appareils, il faudra ajouter Supabase/Firebase plus tard.

## Installation

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Netlify

Build command :
```bash
npm run build
```

Publish directory :
```bash
dist
```
