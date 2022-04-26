import { ISources } from "../../scripts/interfaces"

export function compile(_scSettings: any, _sources: ISources): Promise<string> {
	return new Promise((resolve, reject) => {
		resolve(`CESTMADDY v2.0.0-a<br>MIT License`)
	})
}
