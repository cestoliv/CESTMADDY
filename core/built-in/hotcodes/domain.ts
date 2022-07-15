import { HotData } from "../../scripts/interfaces"

export function compile(_arg: string | null, data: HotData): Promise<string> {
	return new Promise((resolve, reject) => {
		resolve(data.domain)
	})
}
