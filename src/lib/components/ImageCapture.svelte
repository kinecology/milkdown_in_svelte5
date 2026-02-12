<script lang="ts">
    import * as Sheet from "$lib/components/ui/sheet";
    import {Button} from "$lib/components/ui/button";
    import { Check
    } from "lucide-svelte/icons";
    import { cameraIsActive } from "$lib/view.store";
    import { onDestroy } from "svelte";
    import { Buffer } from 'buffer';
    
    export let photoInput: HTMLInputElement;
     
    
    export function startCamera(event) {
        $cameraIsActive = true;
        document.getElementById("cameraInput").click();
    }
     
    let sheetOpenCamera = false;

    // When the user selects (or captures) a file
    export function handleFileChange(event) {
      const file = event.target.files[0];
 
      if (file) {
        photoFile = file;
        photoUrl = URL.createObjectURL(file);
        sheetOpenCamera = true;
      }
    };

    export let handleImageUploadSuccess = (src: string, alt: string, image_id: string) => {};

    let photoFile: File | null = null;
    let photoUrl = "";
    
    let doUpload = async (file: File, fileType: string, apiUrl: string) => {
       const reader = new FileReader();
       reader.onload = async (load_event) => {
           const fileBytes = load_event.target?.result as ArrayBuffer;
           const buffer = Buffer.from(fileBytes);
           const blob = new Blob([buffer]);
           const formData = new FormData();
           formData.set('filename', file?.name);
           formData.append(fileType, blob, file?.name);
           
           const result = await fetch(apiUrl, {
               method: 'PUT',
               headers: {
                 "Access-Control-Allow-Origin": "*",
                 "Accept": "application/json; Charset=utf-8",
               },
               body: formData
           });
           let json = await result.json();
           if (!!json.src) {
              await handleImageUploadSuccess(json.src, json.alt, json.id);
           }
       }
       // now load it to trigger the above onload.
       reader.readAsArrayBuffer(file); 
    };

    let saveCapturedImage = async () => {
      let url: string = "/api/images";
      let fileType = 'image';
      await doUpload(photoFile, fileType, url);
      sheetOpenCamera = false;
      $cameraIsActive = false;
      photoInput.value = ""; 
    //   resetPhotoInput();
    };

    let cancelCapturedImage = () => {
      if (!!photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
       if (!!photoInput) {
        photoInput.value = "";
      }
      sheetOpenCamera = false;
      $cameraIsActive = false;
    };

     // Clean up the blob URL when component is destroyed
    onDestroy(() => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    });

</script>
<style>
    .preview {
        display: block;
        margin: 0 auto;
        max-height: 80vh;
        border-radius: 0.5em;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
</style>
<div>
<Sheet.Root bind:open={sheetOpenCamera}>
    <Sheet.Content side="bottom" class="h-auto">
            <Sheet.Header></Sheet.Header>
            <div class="pt-5">
              {#if photoUrl}
                <div class="text-center">
                  <img src={photoUrl} alt="Captured preview" class="preview" />
                </div>
                {/if}
                <div class="mt-4 grid grid-cols-2 gap-4">
                  <Button onclick = {saveCapturedImage}>
                    <Check class="size-6 mr-3" /> Save
                  </Button>
                  <Button variant="secondary" onclick = {cancelCapturedImage}>
                    Cancel
                  </Button>
                </div>
            </div>
    </Sheet.Content>
  </Sheet.Root>
</div>