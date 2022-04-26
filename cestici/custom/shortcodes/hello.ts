import { ISources } from "../../../core/scripts/interfaces"

export function compile(_scSettings: any, _sources: ISources): Promise<string> {
	return new Promise((resolve, reject) => {
		resolve(`Hello World!`)
	})
}
