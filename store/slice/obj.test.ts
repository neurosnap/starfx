import { asserts, describe, it } from "../../test.ts";
import { configureStore, updateStore } from "../../store/mod.ts";

import { createObj } from "./obj.ts";
const tests = describe("createObj()");

export type TCurrentUser = {
	username: string;
	userId: number;
	isadmin: boolean;
	roles: string[];
};

const NAME = "currentUser";
const crtInitialState = {
	username: "",
	userId: 0,
	isadmin: false,
	roles: [],
}

const slice = createObj<TCurrentUser>({
	name: NAME,
	initialState: crtInitialState,
});

Deno.test( "sets up an obj", async () => {
	const store = configureStore({
		initialState: {
			[NAME]: crtInitialState,
		},
	});
	
	await store.run(function* () {

		yield* updateStore(slice.set({ 
			username: "bob", 
			userId: 1,
			isadmin: true,
			roles: ["admin", "user"],
		}));

	});

	asserts.assertEquals(store.getState()['currentUser'], { 
		username: "bob",
		userId: 1,
		isadmin: true,
		roles: ["admin", "user"]
	 });
	

	await store.run(function* () {

		yield* updateStore(slice.patch({ key: "username", value: "alice" }));
	});
	
	asserts.assertEquals(store.getState()['currentUser'], {
		username: "alice",
		userId: 1,
		isadmin: true,
		roles: ["admin", "user"]
	});

	await store.run(function* () {

		yield* updateStore(slice.patch({ key: "roles", value: ["admin", "superuser"] }));
	});

	asserts.assertEquals(store.getState()['currentUser'], {
		username: "alice",
		userId: 1,
		isadmin: true,
		roles: ["admin", "superuser"]
	});
});

