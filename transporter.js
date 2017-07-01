var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {
		if (creep.memory.gathering) {
			if (creep.memory.targetId) {
				let target = Game.getObjectById(creep.memory.targetId);
				if (target) {
					let err;
					if (target instanceof Resource) {
						err = creep.pickup(target);
					}
					if (err == 0) {
						Memory.energyPush[creep.memory.targetId].reserved -= creep.memory.reserved;
					}
					if (err == ERR_NOT_IN_RANGE) {
						creep.moveTo(target);
					}
				} else {
					delete creep.memory.targetId;
				}
			} else {
				if (Object.keys(Memory.energyPush).length > 0) {
					let best = {id:null, cost:1000};
					for (let id in Memory.energyPush) {
						let possible = Game.getObjectById(id);
						if (possible) {
						    let path = PathFinder.search(creep.pos, {pos:possible.pos, range:1}, {swampCost:10, plainCost:2, roomCallback:global.costMatrixCallback});
							let cost = path.cost * 3 + Math.max(0, ((creep.carryCapacity - creep.carry.energy) - (possible.amount - Memory.energyPush[id].reserved)));
							//console.log(cost +" "+ path.cost*4 +" " + possible.amount + " " + Memory.energyPush[id].reserved + " " + id);
    						if (cost < best.cost) {
    							best.id = id;
    							best.cost = path.cost;
    						}
						}
					}
					if (best.id != null) {
						creep.memory.targetId = best.id;
						creep.memory.reserved = creep.carryCapacity - creep.carry.energy;
						Memory.energyPush[best.id].reserved += creep.memory.reserved;
					}
				}
			}
			if (creep.carry.energy == creep.carryCapacity) {
	        	creep.memory.gathering = false;
				creep.memory.targetId = null;
			}
	    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
	        creep.memory.gathering = true;
			creep.memory.targetId = null;
	    } else if (creep.room != Game.spawns.Spawn1.room) {
			creep.moveTo(Game.spawns.Spawn1);
		} else {
			if (!creep.memory.targetId) {
				let storage;
				let possibleTargets = [];
				for (let i in Memory.energyPull) {
					let possible = Game.getObjectById(i);
					if (possible) {
						if (possible instanceof StructureExtension) {
							if (possible.energyCapacity - possible.energy - Memory.energyPull[possible.id].reserved > 0) {
								possibleTargets.push(possible);
							}
						} else if (possible instanceof StructureContainer) {
							if (possible.storeCapacity - possible.store[RESOURCE_ENERGY] - Memory.energyPull[possible.id].reserved > 0) {
								possibleTargets.push(possible);
							}
						} else if (possible instanceof StructureSpawn) {
							if (possible.energyCapacity - possible.energy - Memory.energyPull[possible.id].reserved > 0) {
								possibleTargets.push(possible);
							}
						} else if (possible instanceof StructureTower) {
							if (possible.energyCapacity - possible.energy - Memory.energyPull[possible.id].reserved > 0) {
								possibleTargets.push(possible);
							}
						} else if (possible instanceof Creep) {
							if (possible.carryCapacity - possible.carry.energy - Memory.energyPull[possible.id].reserved > 0) {
								possibleTargets.push(possible);
							}
						} else if (possible instanceof StructureStorage) {
							storage = possible;
						} else {
							console.log(`IT'S ALL GONE WRONG. ${creep.name} ${possible}`);
						}
					}
				}

				let target = null;
				let best = 1000000;
				for (let i of possibleTargets) {
					let path = PathFinder.search(creep.pos, {pos:i.pos, range:1}, {swampCost:10, plainCost:2, roomCallback:global.costMatrixCallback});
					if (path.cost < best) {
						best = path.cost;
						target = i;
					}
				}

				if (!target && storage) {
					target = storage;
				}

				let reserve = Math.min(creep.carry.energy, Memory.energyPull[target.id].desired);
				Memory.energyPull[target.id].reserved += reserve;
				creep.memory.reserved = reserve;
				creep.memory.targetId = target.id;
			}

			let target = Game.getObjectById(creep.memory.targetId);
			if (!target) {
				creep.moveTo(Game.spawns.Spawn1, {range: 3});
				if (creep.pos.inRangeTo(Game.spawns.Spawn1.pos, 5)) {
					creep.drop(RESOURCE_ENERGY);
				}
				creep.memory.targetId = null;
				creep.memory.reserved = 0;
			}

			//if (debug) console.log(target);
			let err = creep.transfer(target, RESOURCE_ENERGY);
	        if (err == ERR_NOT_IN_RANGE) {
	            creep.moveTo(target);
	        } else if (err == OK || err == ERR_FULL) {
				Memory.energyPull[creep.memory.targetId].reserved -= creep.memory.reserved;
				creep.memory.reserved = 0;
				creep.memory.targetId = null;
			} else if (err != ERR_FULL) {
				console.log("Transporter.transfer error: " + err);
			}
		}
	}
};
