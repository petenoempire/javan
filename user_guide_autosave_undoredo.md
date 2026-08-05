# User Guide: Auto-Save and Undo/Redo Features in Create Studio

This guide provides an overview of the new Auto-Save and Undo/Redo functionalities integrated into the Javan Create Studio, designed to enhance your editing experience and safeguard your creative work.

## 1. Auto-Save: Never Lose Your Progress

The Create Studio now features an **automatic state persistence** mechanism, ensuring that your edits are continuously saved in the background. This means you can work on your projects with confidence, knowing that your progress is protected even if you accidentally close your browser tab, refresh the page, or encounter an unexpected interruption.

### How it Works:

*   **Continuous Saving**: As you make changes to your timeline, text overlays, music selections, and mixer settings, the studio automatically saves your current state locally within your browser's storage.
*   **Seamless Recovery**: If you leave the Create Studio and return later, or if your session is interrupted, the system will attempt to restore your last saved state, allowing you to pick up exactly where you left off.

### Important Considerations:

*   **Local Storage**: Auto-save relies on your browser's local storage. Clearing your browser data (specifically 
local storage) will remove your auto-saved progress.
*   **Blob Data**: While the metadata of your clips (trim points, filters, etc.) is saved, the actual media files (video/image blobs) are not directly stored in local storage due to size limitations. In case of a full browser data clear, you might need to re-upload your original media files, but your editing choices will be preserved.

## 2. Undo/Redo Engine: Instant Control Over Your Edits

Gain precise control over your creative process with the new, reactive Undo/Redo functionality. Whether you're adjusting clips in the timeline or fine-tuning text on the canvas, you can instantly revert or reapply changes with dedicated action buttons.

### How to Use:

*   **Undo Button** (`<Undo2>` icon): Located in the top-center of the editing interface (both in the Timeline Editor and Text Post Canvas), this button allows you to step back through your recent actions, reverting to a previous state of your project.
*   **Redo Button** (`<Redo2>` icon): Positioned next to the Undo button, the Redo button lets you reapply actions that you have previously undone.

### Key Features:

*   **Reactive Interface**: The Undo/Redo buttons are instantly enabled or disabled based on the availability of actions in your history, providing clear visual feedback.
*   **Extensive History**: The system maintains a comprehensive history of your edits, allowing you to go back multiple steps to find the perfect version of your work.
*   **Scope**: Undo/Redo actions apply to changes made to clips (adding, removing, trimming, filtering, speeding, volume adjustments) and text overlays (adding, editing text, position, size, color, duration).

With these new features, the Javan Create Studio empowers you with greater control and peace of mind throughout your content creation journey.
