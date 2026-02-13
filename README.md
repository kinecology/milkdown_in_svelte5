# Not a svelte component

This demo shows how the [Milkdown](https://milkdown.dev/) editor can work with Svelte 5.

The original code was for Svelte 4 and I am in the process of porting it.

This is **not** designed for wide use; rather, it is extracted code from the Svelte 4 app as needed to show a fellow dev. I simply chopped out the domain-specific stuff and made a demo [to answer his request on github](https://github.com/Milkdown/milkdown/issues/2221#issuecomment-3831173954). (I hope this helps you develop a menu bar for Milkdown -- espcially if it is Svelte-friendly :-)

Also, I don't know Milkdown or Prosemirror in depth, so if you spot some redundancies or complexities in all those imports, or easier ways to do things, please let me know.

# Install

```
npm install

npm run dev
```

# Sveltekit

Below is hte readme that the svelte generator spits out:

-------

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv create --template minimal --types ts --add prettier tailwindcss="plugins:none" sveltekit-adapter="adapter:auto" --install npm milkdown_in_svelte5
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
