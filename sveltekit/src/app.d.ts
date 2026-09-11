// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// As variáveis que o Vite expõe ao app (as que começam com VITE_).
	interface ImportMetaEnv {
		readonly VITE_SUPERDB_URL?: string;
		readonly VITE_SUPERDB_ANON_KEY?: string;
		readonly VITE_SUPERDB_PROJECT?: string;
	}
}

export {};
