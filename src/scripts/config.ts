import { load } from 'js-yaml'
import fs from 'fs'
import 'colors'

const file = fs.readFileSync('./cestici/config.yml', 'utf8')
const configYaml = load(file)

export const conf = (path: string, type: string, required: boolean = true) => {
	const	paths:string[] = path.split('.')
	var		elem:any
	var		elemType:string

	elem = configYaml
	for (let elemI = 0; elemI < paths.length; elemI++) {
		if (elem.hasOwnProperty(paths[elemI]))
			elem = elem[paths[elemI]]
		else
		{
			if (!required)
				return null
			console.log(`Config : ${paths.slice(0, elemI + 1).join('.')} is not defined`.red)
			return process.exit(1)
		}
	}
	// CHECK TYPE
	// supported types : number, string, boolean, object, array
	elemType = typeof(elem)
	if (elemType == "object" && Array.isArray(elem))
		elemType = "array"
	if (elemType != type)
	{
		console.log(`Config : Wrong type for ${path}, it is of type ${elemType} and should be of type ${type}`.red)
		return process.exit(1)
	}
	else
		return elem
}
