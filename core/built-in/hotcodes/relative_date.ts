import moment from "moment";
import { HotData } from "../../scripts/interfaces"

export function compile(scSettings: any, _data: HotData): Promise<string> {
	return new Promise((resolve, reject) => {
		resolve (moment(scSettings["date"], "YYYY-MM-DDThh:mm:ss").fromNow())
	})
}
