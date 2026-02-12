<script lang="ts">
    import * as ContextMenu from "$lib/components/ui/context-menu";
    import { ClipboardCopy, ClipboardPaste, Scissors } from "lucide-svelte/icons";  
    
    export let handlePaste: null | ((content: string)=> void);
    export let handleCopy: null | (()=> void);
    export let handleCut: null | (()=> void);
  
  
    export let canEdit: boolean = false;

    async function onPaste(e: any) {
      if (!!handlePaste) {
        const content = await navigator.clipboard.readText();
        handlePaste(content);
      }
    }

    async function onCopy(e: any) {
      if (!!handleCopy) {
        handleCopy();
      }
    }

    async function onCut(e: any) {
      if (!!handleCut) {
        handleCut();
      }
    }
 </script>
   <ContextMenu.Root>
    <ContextMenu.Trigger>
        <slot />
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Item onclick={onCopy}>
        <ClipboardCopy class="mr-4 h-[1.2rem] w-[1.2rem] opacity-50" />
        Copy
      </ContextMenu.Item>
      {#if canEdit && !!handlePaste}
        <ContextMenu.Item onclick={onCut}>
          <Scissors class="mr-4 h-[1.2rem] w-[1.2rem] opacity-50" />
          Cut
        </ContextMenu.Item>
        <ContextMenu.Item onclick={onPaste}>
          <ClipboardPaste class="mr-4 h-[1.2rem] w-[1.2rem] opacity-50" />
          Paste
        </ContextMenu.Item>
      {/if}
    </ContextMenu.Content>
  </ContextMenu.Root>