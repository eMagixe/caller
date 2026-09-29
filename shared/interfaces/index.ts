import type { Ref } from 'vue'

export interface State {
	data: Ref<Product[] | []>
	refresh(): Promise<void>
	pending: Ref<boolean>
}
