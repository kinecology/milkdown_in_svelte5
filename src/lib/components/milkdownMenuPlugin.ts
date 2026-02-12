import { Plugin, PluginKey, type EditorState } from '@milkdown/prose/state'
import { $ctx, $prose } from '@milkdown/utils'
import { type MarkType } from '@milkdown/prose/model'
import { type MilkdownPlugin } from '@milkdown/ctx'
import { editorStateCtx } from '@milkdown/core';
import { type Ctx } from '@milkdown/ctx'
    
export type MarkAndCommandType = [MarkType, string];

export type FontButtonConfigType = { fontMarks: Map<string, MarkAndCommandType>, setCurrentMarks?: ((marks: string[]) => void)};

export const menuConfig: FontButtonConfigType = {
  fontMarks: new Map<string, MarkAndCommandType>
}

export const menuDefaultConfig = (ctx: Ctx) => {
  // At config time, schema is empty.
  // Have to wait until after editor is constructed.
  // const schema = ctx.get(schemaCtx);
   ctx.set(menuConfigCtx.key, menuConfig)
  // so we fill it later with an action; see JournalEditor.svelte.        
}

// menu config context
export const menuConfigCtx = $ctx({}, 'menuConfig'); // client will populate

const key = new PluginKey('MILKDOWN_BITS_PLUGIN_MENU')

const hasMark = (state: EditorState, type: MarkType | undefined): boolean => {
    if (!type) return false
    const { from, $from, to, empty } = state.selection
    if (empty) return !!type.isInSet(state.storedMarks || $from.marks())
  
    return state.doc.rangeHasMark(from, to, type)
  }
  
export const menuView = $prose((ctx) => {
  const prosePlugin = new Plugin({
    key,
    view: (editorView) => {
      return {
        update: () => {
            let menuConfig = ctx.get('menuConfig') as FontButtonConfigType;
            let marks = [];
            for (let [key, value] of menuConfig.fontMarks) {
                // console.log("value", value)
                const state = ctx.get(editorStateCtx)
                if (hasMark(state, value[0])) {
                    marks.push(key)
                }
            }
            if (menuConfig.setCurrentMarks) menuConfig.setCurrentMarks(marks);
        },
        destroy: () => {
        },
      }
    },
  })
  return prosePlugin
})

export const menu: MilkdownPlugin[] = [menuConfigCtx, menuView]
