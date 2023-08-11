// Low cost grow script that is called with multiple threads to ease RAM usage
export async function main(ns) {
	let target = ns.args[0];
	let repeat = ns.args[1];
	let batch_land = ns.args[2];

	let runtime = ns.getGrowTime(target);

	do {
		if (batch_land) {
			let currentTime = performance.now()
			await ns.sleep(batch_land - currentTime - runtime)
		}
		await ns.grow(target)
	} while (repeat)
}