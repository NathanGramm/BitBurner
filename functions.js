/**
 * Grabs all of the servers in the game recursively
 * @param ns Game API object
 * @param current Server to start from
 * @param set Set to store all connections
 * @return An array of all servers in the game
 */
export function serverList(ns, current = "home", set = new Set()) {
	let connections = ns.scan(current);
	let currConnections = connections.filter(c => !set.has(c))
	currConnections.forEach(n => {
		set.add(n);
		return serverList(ns, n, set)
	})
	return Array.from(set.keys());
}

/**
 * This function checks to see if the player has root access by checking 
 * hacking level and root access. If there is no root access it tries to
 * gain access automatically
 * @param target Server being checked
 * @return (boolean) True or False depending on if the player can and has 
 * root access or cannot and does not have root access
 */
export async function rootAccess(ns, target = "n00dles") {
	// If the player already has root access then return true
	if (ns.hasRootAccess(target)) return true;
	//Open all ports possible
	try {
		ns.brutessh(target);
		ns.ftpcrack(target);
		ns.relaysmtp(target);
		ns.httpworm(target);
		ns.sqlinject(target);
	} catch { }
	// If all ports necessary are opened, nuke and return true, if not return false
	try {
		ns.nuke(target);
		return true;
	} catch {
		return false;
	}
}

// Not my work, used to run scripts overtime so that larger scripts can use less RAM at once
export async function runCom1(ns, command, fileName, args = []) {
	var precursor = "gang-"; // Could be gang-, blade-, etc
	var fileName = "/Temp/" + precursor + fileName + ".txt";
	var fileName2 = fileName + ".js";
	// COMPLEX SCRIPT
	let script = `export async function main(ns) {` +
		`let r;try{r=JSON.stringify(\n` +
		` ${command}\n` +
		`);}catch(e){r="ERROR: "+(typeof e=='string'?e:e.message||JSON.stringify(e));}\n` +
		`const f="${fileName}"; if(ns.read(f)!==r) await ns.write(f,r,'w') } `;
	var oldContents = ns.read(fileName2);
	while (oldContents != script) {
		await ns.write(fileName2, script, "w");
		// Wait for script to appear readable (can be finicky on write)
		var oldContents = ns.read(fileName2);
	}
	for (var ij = 0; ij < 5; ij++) {
		if (args[ij] == null) args[ij] = "0";
	};
	//Run the script!
	await ns.exec(fileName2, "home", 1, args[0], args[1], args[2], args[3]);
	// We ‘try’ to catch JSON errors (they vanish after 1-2 loops)
	const fileData = await ns.read(fileName);
	try {
		var fileData2 = JSON.parse(fileData);
	} catch (e) {
		console.log("Unable to parse the string.")
	}
	return fileData2;
}