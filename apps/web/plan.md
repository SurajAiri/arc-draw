# Implementation Plan

## Issue 1: Fix Missing Local Saves
The debounce on local saving means rapid navigation or tab closures can lose data. 
- In `ExcalidrawCanvas.tsx`, we will update the existing `visibilitychange` listener to synchronously `saveLocal` when the tab is hidden.
- We will also add a `useEffect` cleanup function to force a final flush to IndexedDB when the component unmounts.

## Issue 2: Fix Canvas vs Export Color Mismatch
Excalidraw applies a dark mode filter to images on the canvas, which forces us to "counter-invert" colors (like swapping White for Black) to make them look correct in the UI. However, this baked-in fake color ruins the export, because Excalidraw doesn't apply the same filter during light-mode exports.

To fix this:
1. We will track `appState.openDialog?.name === "imageExport"`.
2. When the user opens the export dialog, we will rapidly regenerate all custom icon SVGs using their **real, true colors**, bypassing the dark-mode trick. 
3. This ensures the export engine gets the exact colors the user chose.
4. When the export dialog is closed, we will revert them back to the dark-mode "tricked" colors so the canvas UI remains correct.
