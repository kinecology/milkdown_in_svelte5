<script lang="ts">
    import {
        Pencil, Check,
        Undo2, Redo2,
        Replace, Bold, Italic, Strikethrough,
        Heading,
        List, ListOrdered, TextQuote,
        Camera
    } from "lucide-svelte/icons";

    // shadcn-svelte components:
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
	import { Toolbar } from "bits-ui";
    import * as ToggleGroup from "$lib/components/ui/toggle-group";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Accordion from "$lib/components/ui/accordion";

    // misc components:
    import { Svroller } from 'svrollbar';
    import Tags from "svelte-tags-input";
    
    // Milkdown stuffs:
    import { type Ctx } from '@milkdown/ctx';
    import { Editor, rootCtx, editorViewCtx, editorViewOptionsCtx, serializerCtx, defaultValueCtx,  schemaCtx, commandsCtx  } from '@milkdown/core';
	import { commonmark } from '@milkdown/preset-commonmark';
    import { gfm } from '@milkdown/preset-gfm';
	import { nord } from '@milkdown/theme-nord';
    import { history } from '@milkdown/plugin-history';
    import { clipboard } from '@milkdown/plugin-clipboard';
    import { cursor, dropCursorConfig } from '@milkdown/plugin-cursor';
  	import { upload } from '@milkdown/plugin-upload';
    import type { Node } from '@milkdown/prose/model';
    import { insert, replaceAll } from '@milkdown/kit/utils';
    import { $prose as prose } from '@milkdown/utils';
	// prose / milkdown stuff:
    import { deleteSelection } from '@milkdown/prose/commands';
    import { Plugin, PluginKey } from '@milkdown/prose/state';
    import { Decoration, DecorationSet } from '@milkdown/prose/view';
    import { EditorView } from 'prosemirror-view';
    import { undoDepth } from 'prosemirror-history';
    import { TextSelection } from "prosemirror-state";
    
    // svelte stuff:
    import { slide } from 'svelte/transition';   
    import { onMount, tick  } from "svelte";
    import { goto, beforeNavigate } from '$app/navigation';

    // my custom stuff:
    import { menuConfig, menuDefaultConfig, menu } from './milkdownMenuPlugin';
    import SearchAndReplaceModal from "./SearchAndReplaceModal.svelte";
    import ImageCapture from "./ImageCapture.svelte";
    import EditorContextMenu from "./EditorContextMenu.svelte"
	import type { DigitalNoteType } from "$lib/view.store";
    import { journalEditorDirty, showDirtySaveButtons, isMobileScreen, isMobileDevice } from "$lib/view.store";
        
    
    const searchHighlightKey = new PluginKey('searchHighlight');

    // Create a Milkdown plugin that wraps the ProseMirror plugin
    const searchHighlightPlugin = prose((ctx) => {
        return new Plugin({
            key: searchHighlightKey,
            state: {
            init() {
                return DecorationSet.empty;
            },
            apply(tr, set) {
                set = set.map(tr.mapping, tr.doc);
                
                const meta = tr.getMeta(searchHighlightKey);
                if (meta) {
                set = DecorationSet.empty;
                if (meta.from !== undefined && meta.to !== undefined) {
                    const deco = Decoration.inline(meta.from, meta.to, {
                    class: 'search-highlight'
                    });
                    set = DecorationSet.create(tr.doc, [deco]);
                }
                } 
                return set;
            }
            },
            props: {
            decorations(state) {
                const decos = this.getState(state);
                return decos;
            }
            }
        });
        });


    export let editable: boolean; // mode. Has button been clicked? // probably rename to "editing"
    export let readonly: boolean = false; // allowable. Can button be clicked?

    export let accordionOpen: boolean = false;

    export let note: DigitalNoteType;

    ///////////////
    // Plugin: see milkdownMenuPlugin
    // This could be done with component bind
    let currentMarks : string[] = [];
    let previousMarks: string[] = [];

    menuConfig.setCurrentMarks =  (marks: string[]) => {
            currentMarks = marks;
    }
    //     // At config time, schema is empty.
    //     // Have to wait until after editor is constructed.
    //     // const schema = ctx.get(schemaCtx);
    //     // ctx.set(menuConfigCtx.key, menuConfig)
    //     // So, we fill it later with an action; see below:        
    //	

   	// https://mirone.me/a-brief-introduction-to-milkdown-v7/

    const theEditor : any = {editor: null, getMarkdown: () => {}, focus: () => {}};
    
    async function editor(dom: any) {
        const MakeEditor = Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, dom);
                ctx.set(defaultValueCtx, note.body);
                ctx.set(editorViewOptionsCtx, { editable: () => editable } );
                ctx.set(dropCursorConfig.key, { 'width': 4, 'color': 'green'})

            })
            .config(menuDefaultConfig)
            .config(nord)  // Last, or css can get flaky.
            .use(commonmark)
            .use(menu)
            .use(gfm)
            .use(history)
            .use(clipboard)
            .use(upload)
            .use(cursor)
            .use(searchHighlightPlugin)
            .create();
        
        MakeEditor.then((editor) => {
            // here you have access to the editor instance. 
            theEditor.editor = editor;
            editor.action((ctx) => {
                const schema = ctx.get(schemaCtx);
                menuConfig.fontMarks.set("bold", [schema.marks.strong, 'ToggleStrong']);
                menuConfig.fontMarks.set("italic", [schema.marks.emphasis, 'ToggleEmphasis']);
                menuConfig.fontMarks.set("strikethrough", [schema.marks.strike_through, 'ToggleStrikeThrough']);
            });
            
            theEditor.getMarkdown = () =>
                editor.action((ctx) => {
                    const editorView = ctx.get(editorViewCtx);
                    const serializer = ctx.get(serializerCtx);
                    return serializer(editorView.state.doc);
                });
            
            theEditor.applyCommand = (command: string | string[]) => 
                editor.action((ctx) => {
                    if (typeof command === 'string') {
                        ctx.get(commandsCtx).call(command)
                    } else {
                        ctx.get(commandsCtx).call(command[0], command[1])
                    }
                });

            theEditor.focus = () => {
                if (editable) {
                    let editorEl : HTMLElement = document.querySelector(".editor")!;
                    if (editorEl) {
                       $journalEditorDirty = true;
                        editorEl.focus();
                    }
                }
      
            }       
        });
    } // <use: this function as svelte component />
            
    // This works in Svelte 4, but not Svelte 5:
    // let handleMarkChange = (values: string[] | undefined) => {
    //     console.log("values", values);
    //     if (values?.length) {
    //         let diff = values
    //                 .filter(x => !currentMarks.includes(x))
    //                 .concat(currentMarks.filter(x => !values.includes(x)));
    //         if (diff.length) {
    //             let mark = diff[0];
    //             let command: string = menuConfig.fontMarks.get(mark)![1];
    //            theEditor.applyCommand(command);
    //         }
    //     }
    //  }
    // Had to do it like this for svetle 5:
      let handleMarkChange = (values: string[] | undefined) => {
        console.log("values", values);
        if (values?.length !== undefined) {
            let diff = (values || [])
                .filter(x => !previousMarks.includes(x))
                .concat(previousMarks.filter(x => !(values || []).includes(x)));
            
            if (diff.length) {
                let mark = diff[0];
                let command: string = menuConfig.fontMarks.get(mark)![1];
                theEditor.applyCommand(command);
            }
            
            currentMarks = [...(values || [])];
            previousMarks = values || [];
        }
    }

    let headingClick = (val: string) => {
        if (val === '0') {
            theEditor.applyCommand('TurnIntoText');
        } else {
            theEditor.applyCommand(['WrapInHeading', val]);
        }
    }

   let editorV: EditorView | null = null;
   const hasUndoable = async () => {
        if (editorV == null) {
            await theEditor.editor.action((ctx: Ctx) => {
                editorV = ctx.get(editorViewCtx);
            });
        }
        return undoDepth(editorV!.state) > 0;
    };

    let formatClick = async (command: string) => {
        if (command == 'Undo') {
                if (await hasUndoable()) {
                    theEditor.applyCommand(command)
                } else {
                    cancelEdits(); // leaves edit mode
                }
        } else {
            console.log("command", command);
            theEditor.applyCommand(command);
        }
    }

    let insertTimestamp = () => {
        let new_date = new Date();
        let date_string = new_date.toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'})
        let day_string = new_date.toLocaleString('en-US', {weekday: 'long'})
        let time_string = new_date.toLocaleString('en-US', {
            hour: 'numeric', minute: 'numeric', hour12: true })
        // Using here-doc type stuff in string will not work; it breaks markdown.
        // Seems it has to all be on one line:
        let content = `- Date: \t\t**${date_string}**\n- Day: \t\t${day_string}\n- Time: \t\t${time_string}\n`;

        theEditor.editor.action(insert(content));       
        theEditor.focus();
    }


    let handleCopy = () => {
        theEditor.editor.action((ctx: Ctx) => {          
            const editorView = ctx.get(editorViewCtx);
            const serializer = ctx.get(serializerCtx)
            const { from, to } = editorView.state.selection
            if (from === to) return;  
            const slice = editorView.state.doc.slice(from, to);
            const node = editorView.state.schema.topNodeType.create(null, slice.content);
            const markdown = serializer(node);
            navigator.clipboard.writeText(markdown);
        });
    }

    let handlePaste = (content: string) => {
        theEditor.editor.action(insert(content));
        theEditor.focus();
    }

    let handleCut = () => {
        handleCopy(); // to clipboard
        theEditor.editor.action((ctx: any) => {
            const view = ctx.get(editorViewCtx);
            deleteSelection(view.state, view.dispatch);
        });
    }

    async function saveNoteData() {
        let md = theEditor.getMarkdown();
        note.body = md;
        // the following might not be needed. Sometimes you cannot get a cursor
        // after clicking edit button. Maybe this happens only in eco. ??
        if (!note.body) {
            note.body = "";
        } 
        // save your data here
        alert(`SAVED: ${note.body}`);
        $journalEditorDirty = false;
     }

    let handleEditClick = () => { 
        console.log("edit");
        // DO NOT here set editable = true;
        // It will trigger an UPSERT in onDestroy!
        let acc_str = (accordion === 'titleEditor') ? "?accordion=open" : ""
        goto(`/edit`);
    }

    let handleDblClickEditor = () => {
        if (!editable) {
        handleEditClick();
        }
    }

 
    let isSaving = false;

    async function saveEdits() {
        if (isSaving) return;  // Prevent double-saves
        isSaving = true;
        await saveNoteData();
        $showDirtySaveButtons = false;
        goto('/');   
    }

    let cancelEdits = function() {     
        goto('/');
    }
  
    let accordion: string | undefined = "undefined";  //"titleEditor" opens it; undefined closes it.
    let titleInput : HTMLInputElement;

   
    onMount(() => {
        $journalEditorDirty = false;
        (window as any).__saveNoteBeforeExit = async () => {
            if (editable && $journalEditorDirty) {
                 await saveEdits();
            }
        };
        return () => {
            delete (window as any).__saveNoteBeforeExit;
        };
    });

    let svrollerHeight: string;

    $: svrollerHeight =	$isMobileDevice ? "96svh" : "92svh";

    $: if (editable) {
            tick().then(() => {
                if (accordionOpen) {
                        accordion = "titleEditor";
                        titleInput = document.getElementById("name-input") as HTMLInputElement;
                        titleInput?.focus();
                        titleInput?.select();
                    } 
                    else {
                    theEditor.focus();
                    }
            });
    }

    let hasInitialized = false;

  
    beforeNavigate(async (navigation) => {
        // This handles internal SvelteKit navigation only
        // For external navigation via appExit, data is already saved
        if (editable && $journalEditorDirty && navigation.to) {
            navigation.cancel();
            await saveNoteData();
            // $journalEditorDirty = false;
            goto(navigation.to?.url || '/');
        }
    });

    let searchAndReplaceOpen = false;

    let currentSearchIndex = -1;
    let lastSearchText = "";

    let findNextOccurrence = (searchText: string) => {
        if (!searchText) return;
        // Reset index if search text changed
        if (searchText !== lastSearchText) {
            currentSearchIndex = -1;
            lastSearchText = searchText;
        }
        theEditor.editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            const { state } = view;
            const { doc } = state;
            // Find all occurrences in the ProseMirror document
            const occurrences: { from: number; to: number }[] = [];
            doc.descendants((node, pos) => {
            if (node.isText && node.text) {
                const text = node.text;
                let index = 0;
                while ((index = text.indexOf(searchText, index)) !== -1) {
                occurrences.push({
                    from: pos + index,
                    to: pos + index + searchText.length
                });
                index += 1;
                }
            }
            });
            if (occurrences.length === 0) {
                console.log('No occurrences found');
            return;
            }
            // Move to next occurrence (wrap around)
            currentSearchIndex = (currentSearchIndex + 1) % occurrences.length;
            const { from, to } = occurrences[currentSearchIndex];      
            const tr = state.tr
            .setSelection(TextSelection.create(state.doc, from, to))
            .setMeta(searchHighlightKey, { from, to });
            view.dispatch(tr.scrollIntoView());
            setTimeout(() => {
                const domAtPos = view.domAtPos(from);
                if (domAtPos.node) {
                    const element = domAtPos.node.nodeType === 1 
                        ? domAtPos.node as Element
                        : domAtPos.node.parentElement;
                    if (element) {
                        // Find the actual scrollable parent
                        let scrollParent: Element | null = element;
                        while (scrollParent && scrollParent !== document.body) {
                            const style = window.getComputedStyle(scrollParent);
                            const overflowY = style.overflowY;
                            const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
                            const hasScroll = scrollParent.scrollHeight > scrollParent.clientHeight;
                            if (isScrollable && hasScroll) {
                                console.log('Found scrollable parent:', scrollParent);
                                break;
                            }
                            scrollParent = scrollParent.parentElement;
                        }
                        if (scrollParent && scrollParent !== document.body) {
                            const elementRect = element.getBoundingClientRect();
                            const parentRect = scrollParent.getBoundingClientRect();
                            // Calculate scroll offset to center the element
                            let scrollOffset = elementRect.top - parentRect.top - 
                                            (parentRect.height / 2) + (elementRect.height / 2);               
                            if ($isMobileScreen) { // tweak
                                scrollOffset = scrollOffset - 20;
                            }
                            // Jump quick:
                            // scrollParent.scrollTop += scrollOffset;
                            // Or with smooth scrolling:
                            scrollParent.scrollBy({
                                top: scrollOffset,
                                behavior: 'smooth'
                            });
                        } else {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }
            }, 100);
        });
    };


    let replaceAllText = (searchText: string, replaceText: string) => {
        let md = theEditor.getMarkdown();
        const newMarkdown = md.replaceAll(searchText, replaceText);
        let result = theEditor.editor.action(replaceAll(newMarkdown, false));
    };
 
    let photoInput: HTMLInputElement;
     
    let imageCapture: ImageCapture;

    let insertMediaAtBottom = false;

    const handleImageUploadSuccess = async (src: string, alt: string, image_id: string) => {
        // image_id currently not used
        theEditor.editor.action(async (ctx: any) => {
            const editorView = ctx.get(editorViewCtx);
            const schema = ctx.get(schemaCtx);
            const node = schema.nodes.image.create({src: src, alt: alt}) as Node; 
            if (insertMediaAtBottom) {
                await insertNodeAtEnd(editorView, node);
            } else {
                await insertNodeAtCursor(editorView, node);
            }
            insertMediaAtBottom = false;
        });   
    };

    const insertNodeAtCursor = async (view: EditorView, node: Node) => {
        const tr = view.state.tr.replaceSelectionWith(node);
        view.dispatch(tr.scrollIntoView());   // node doesn't even appear without this
     };

    const insertNodeAtEnd = (view: EditorView, node: Node) => {
        const { state } = view;
        const endPos = state.doc.content.size;
        let tr = state.tr.insert(endPos, node);
        view.dispatch(tr);
        requestAnimationFrame(() => {
            const dom = view.domAtPos(endPos).node as HTMLElement;
            dom?.scrollIntoView({ block: 'end', behavior: 'smooth' });
        });
    };

</script>

<style>
    .svroll-container {
       --svrollbar-thumb-opacity: 0.2;
    } 
    .spinner {
        width: 0.9em;
        height: 0.9em;
        margin-right: 0.5em;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        display: inline-block;
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    } 

    :global(.search-highlight) {
        background-color: #ffff00 !important;
        color: #000000 !important;
        padding: 2px 0 !important;
    }

    </style>

<ImageCapture  bind:this={imageCapture} photoInput={photoInput} handleImageUploadSuccess={handleImageUploadSuccess} />

<SearchAndReplaceModal 
  bind:open={searchAndReplaceOpen} 
  bind:handleSearchAndReplace={replaceAllText}
  bind:handleFindNext={findNextOccurrence}
/>

 <div>
    {#if !readonly}
        {#if !editable}
            <Button variant="outline" size="icon" class="absolute top-0 right-0 z-40 h-[2.5rem] dark:text-white-500"
                onclick={() => handleEditClick()}>
                <Pencil class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"  />
            </Button>
        {:else}
            {#if $showDirtySaveButtons}
                <Button variant="secondary" class="absolute top-0 right-0 z-50 h-[2.3rem]"
                    onclick={() => cancelEdits()}>
                    <span>Cancel</span>
                </Button>
                <Button size="icon" class="absolute top-0 right-20 z-50 h-[2.3rem]"
                    onclick={() => saveEdits() }>
                        {#if isSaving}
                            <span class="spinner" aria-hidden="true"></span>
                        {:else}
                            <span>&nbsp;&nbsp;Save&nbsp;&nbsp;</span>
                        {/if}
                </Button>
            {:else}
                <Button size="icon" variant="secondary" class="absolute top-0 right-0 z-50 h-[2.5rem] border border-primary"
                    onclick={() => saveEdits() }>
                        {#if isSaving}
                            <span class="spinner" aria-hidden />
                        {:else}
                            <Check class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"  />
                        {/if}
                </Button>
            {/if}
        {/if}

        <Toolbar.Root
        class="sticky top-0 flex h-10 min-w-max items-center justify-center rounded-10px border border-border bg-background-alt px-[4px] py-1 shadow-mini"
        >
            <ToggleGroup.Root variant="outline" type="multiple" bind:value={currentMarks}
                onValueChange={handleMarkChange}
                >
            {#if editable}       
                <Button variant="outline" class="bg-transparent"
                    onclick={insertTimestamp}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-clock"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.3V14"/><circle cx="16" cy="16" r="6"/></svg>
                </Button>
               <Button variant="outline" class="bg-transparent"
                    onclick={() => {formatClick('Undo')}}>
                    <Undo2 class="size-5" />
                </Button>
                <Button variant="outline" class="bg-transparent"
                    onclick={() => {formatClick('Redo')}}>
                    <Redo2 class="size-5" />
                </Button>
                 <Button variant="outline" class="bg-transparent"
                    onclick={() => searchAndReplaceOpen = true}>
                    <Replace class="size-5" />
                </Button>   
                 <input
                    bind:this={photoInput}
                    type="file"
                    id="cameraInput"
                    accept="image/*"
                    capture="environment"
                    hidden
                    on:change={imageCapture.handleFileChange}
                />
                <Button variant="outline" class="bg-transparent"
                    onclick={imageCapture?.startCamera}>
                    <Camera class="size-5" />
                </Button>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                         {#snippet child({ props })}
                        <Button {...props}  variant="outline" class="bg-transparent">
                            <Heading class="size-5" />
                        </Button>
                         {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content >
                        <DropdownMenu.Label>Heading Size</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Group>
                            <DropdownMenu.Item onclick={() => {headingClick("1")}}>
                                <h1><span style="font-size:80%">Large</span></h1>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item  onclick={() => {headingClick("3")}}>
                                <h3><span style="font-size:80%">Medium</span></h3>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item  onclick={() => {headingClick("4")}}>
                                <h4><span style="font-size:80%">Small</span></h4>
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator></DropdownMenu.Separator>
                            <DropdownMenu.Item  onclick={() => {headingClick("0")}}>
                                <span>Plain Text</span>
                            </DropdownMenu.Item>
                        </DropdownMenu.Group>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
                <ToggleGroup.Item value="bold" aria-label="Toggle bold">
                    <Bold class="size-5" />
                </ToggleGroup.Item>
                <ToggleGroup.Item value="italic" aria-label="Toggle italic">
                    <Italic class="size-5" />
                </ToggleGroup.Item>
                <ToggleGroup.Item value="strikethrough" aria-label="Toggle strikethrough">
                    <Strikethrough class="size-5" />
                </ToggleGroup.Item>     
                <Button variant="outline" class="bg-transparent"
                    onclick={() => {formatClick('WrapInBulletList')}}>
                    <List class="size-5" />
                </Button>
                <Button variant="outline" class="bg-transparent"
                    onclick={() => {formatClick('WrapInOrderedList')}}>
                    <ListOrdered class="size-5" />
                </Button>
                <Button variant="outline" class="bg-transparent"
                    onclick={() => {formatClick('WrapInBlockquote')}}>
                    <TextQuote class="size-5" />
                </Button>
            {:else} ( double-click on the document to edit.  Or, click the Pencil, top right {"---->"} )
            {/if}
            </ToggleGroup.Root>
        </Toolbar.Root>
    {/if}
    <div class="svroll-container pb-0"> <!-- adjust padding if gap below editor -->
    <Svroller alwaysVisible={false} width="max" height={svrollerHeight} margin={{left:0, right:0}}>
        {#if !readonly}
            <div class="journal-editor-title">
            <Accordion.Root bind:value={accordion} class="w-full pb-4">
                <Accordion.Item value="titleEditor">
                <Accordion.Trigger><h3>{note.title}</h3>
                    </Accordion.Trigger>
                <Accordion.Content transition={slide} transitionConfig={{delay: 100, duration: 250 }} class="p-2 pr-4 bg-secondary">
                    <Input class="w-full" id="title-input" type="text" bind:value={note.title} disabled={!editable} />
                     <div class="text-slate-600 text-lg">
                            <!-- see: https://github.com/agustinl/svelte-tags-input -->
                            <Tags bind:tags={note.tags} readonly={!editable} labelText="Tags: " labelShow={true} />
                      </div>
                       <div class="text-center mt-1">
                                    <Button variant="link" onclick={() => {accordion = "undefined"; accordionOpen = false;}}>
                                        &Hat; close &Hat; 
                                    </Button>
                        </div>
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion.Root>  
            </div>
        {:else}
            <div class="ml-4">
                <h4>
                   {note.title}    
                </h4>
            </div>
        {/if}
        <div>
            {#if $isMobileDevice}
                <div use:editor on:dblclick={handleDblClickEditor} role="link" tabindex="0"></div>
            {:else}
                <EditorContextMenu handleCopy={handleCopy} handleCut={handleCut} handlePaste={handlePaste} canEdit={editable}>
                   <div use:editor on:dblclick={handleDblClickEditor} role="link" tabindex="0"></div>
                </EditorContextMenu>
             {/if}
        </div>      
    </Svroller>
    </div>
</div>
{#if $isMobileScreen || $isMobileDevice}   
    <Toolbar.Root class="sticky bottom-0 z-50 pb-8 bg-slate-100 h-10 flex min-w-max items-center justify-center border border-border px-[4px] py-1 shadow-mini">
        <Toolbar.Group type="multiple" class="z-[100] mb-20 mx-20 gap-x-3.5">
            <Toolbar.GroupItem aria-label="camera" value="camera">
                <input
                    bind:this={photoInput}
                    type="file"
                    id="cameraInput"
                    accept="image/*"
                    capture="environment"
                    hidden
                    on:change={imageCapture.handleFileChange}
                />
            <Button variant="outline" class="rounded-full border-4 bg-base-300 px-6" onclick={(e) => {editable = true; insertMediaAtBottom = true; imageCapture?.startCamera(e)}}>
                <Camera class="size-8" />
            </Button>
            </Toolbar.GroupItem>
        </Toolbar.Group>
    </Toolbar.Root>
<!-- </div> -->
{/if}