<script lang="ts">
   import { onMount } from 'svelte';
//   import type { PageData } from '../../../$types';
  import JournalEditor from '$lib/components/JournalEditor.svelte';
  import { type DigitalNoteType } from '../../lib/view.store';
  // import { page } from '$app/stores';
   
//   export let data: PageData; 
  
  onMount(() => {
  
  })

  let noteEditMode = true;
  let note: DigitalNoteType = {title: "My Note", body: "Hellow there **world**, _you lovely **place**_", tags: []};
  </script>
 
 <div class="p-20">
   <JournalEditor editable={noteEditMode} note={note} />
 </div>
  