# Chemistry Atlas V5.0.4 build fix

This patch addresses the three TypeScript errors reported by the V5.0.3 `npm run build:editions` job.

## 1. Define `filteredModels`

`src/App.tsx` already held the `modelSearch` state and rendered `filteredModels`, but had no declaration for it. The patched source derives the filtered list from the typed `modelOptions` data:

```tsx
const activeModel = modelOptions.find((m) => m.id === modelId) || modelOptions[0];
const filteredModels = modelOptions.filter((model) =>
  `${model.name} ${model.formula} ${model.shape}`.toLowerCase().includes(modelSearch.trim().toLowerCase()),
);
```

This fixes both `TS2304: Cannot find name 'filteredModels'` and the downstream implicit-`any` error for the `m` callback parameter. The callback is now inferred from `modelOptions`.

## 2. Import `ExternalLink`

The edition-selector UI rendered `<ExternalLink />` but did not import that icon. It is now included in the existing `lucide-react` import list.

## Run the build

From the extracted project directory, with dependencies installed:

```powershell
npm install
npm run build:editions
```

## Verification boundary

The patched `src/App.tsx` passed a TSX parser check and targeted checks for both fixes. The complete `npm run build:editions` command was attempted, but could not complete in the patching environment because project dependencies were absent; npm installation timed out. Do not interpret this patch as a verified production build.
