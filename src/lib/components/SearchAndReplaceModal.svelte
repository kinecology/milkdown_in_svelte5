<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Button } from "$lib/components/ui/button";
  import { RadioGroup, RadioGroupItem } from "$lib/components/ui/radio-group";
  
  export let open = false;
  export let handleSearchAndReplace = (searchText: string, replaceText: string) => {};
  export let handleFindNext = (searchText: string) => {};
  
  let searchText = "";
  let replaceText = "";
  let mode: "find" | "replace" = "find";
  
  function doAction() {
    if (!!searchText) {
      if (mode === "replace") {
        handleSearchAndReplace(searchText, replaceText);
        open = false;
      } else {
        handleFindNext(searchText);
      }
    }
  }
</script>
<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[425px] top-4 translate-y-0">
    <Dialog.Header>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <RadioGroup bind:value={mode} class="flex gap-4">
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="find" id="mode-find" />
          <Label for="mode-find">Find</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="replace" id="mode-replace" />
          <Label for="mode-replace">Replace</Label>
        </div>
      </RadioGroup>
      
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="search" class="text-right">
          Find
        </Label>
        <Input
          id="search"
          bind:value={searchText}
          class="col-span-3"
        />
      </div>
      
      {#if mode === "replace"}
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="replace" class="text-right">
            Replace with
          </Label>
          <Input
            id="replace"
            bind:value={replaceText}
            class="col-span-3"
          />
        </div>
      {/if}
    </div>
    <Dialog.Footer>
      <!-- <span on:mousedown={(e) => e.preventDefault()} > -->
      <Button type="submit" class="dark:text-white-500" onclick={doAction}>
        {mode === "replace" ? "Replace All" : "Find Next"}
      </Button>
      <!-- </span> -->
      <Button variant="secondary" class="dark:text-white-500" onclick={() => {open = false}}>Cancel</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>