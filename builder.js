module.exports = {

	run: function (creep) {

		if (creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
			creep.gatherEnergy(creep);
	    } else if (creep.memory.gathering && creep.carry.energy === creep.carryCapacity) {
	        creep.memory.gathering = false;
			delete creep.memory.energyId;
	    } else if (!creep.memory.gathering && creep.carry.energy === 0) {
	        creep.memory.gathering = true;
	    } else {
	        var target = Game.getObjectById(creep.memory.targetId);
			if (target instanceof Structure && target.hits === target.hitsMax) {
				creep.memory.targetId = null;
			}
	        if(!target || Game.time - creep.memory.jobStartTime > 100) {
				let possible = {best:1000000, id:null};
				for (let r of Game.rooms[creep.memory.bossRoom].getRoomNames()) {
					if (!Game.rooms[r]) {
						continue;
					}
					if (Game.rooms[r].controller.my) {
						for (let itr of Game.rooms[r].find(FIND_STRUCTURES, {filter: s => s.hits < s.hitsMax && s.hits < 500000})) {
							let score = creep.pos.getRangeTo(itr);
							if (itr.structureType === STRUCTURE_WALL || itr.structureType === STRUCTURE_RAMPART) {
								if (itr.hits > 10000) {
									score += 1000 + itr.hits / 1000;
								} else {
									score -= 100;
								}
							}
							if ((itr.structureType === STRUCTURE_ROAD || itr.structureType === STRUCTURE_CONTAINER)) {
							    if (itr.hits > (itr.hits/2)) {
								    score += 300;
							    } else {
							        score -= 100;
							    }
							}
							if (score < possible.best) {
								possible.best = score;
								possible.id = itr.id;
							}
						}
					}
					let priorityMods = {
						STRUCTURE_WALL:200,
						STRUCTURE_RAMPART:200,
						STRUCTURE_ROAD:100,
						STRUCTURE_CONTAINER:-100,
						STRUCTURE_SPAWN:-200,
						STRUCTURE_STORAGE:-300
					}
					for (let itr of Game.rooms[r].find(FIND_CONSTRUCTION_SITES)) {
						let score = creep.pos.getRangeTo(itr);
						if (score === Infinity) {
							score = 50
						}

						if (priorityMods[itr.structureType]) {
							score += priorityMods[itr.structureType]
						}
						if (score < possible.best) {
							possible.best = score;
							possible.id = itr.id;
						}
					}
				}



				creep.memory.targetId = possible.id;
				target = Game.getObjectById(possible.id);
				creep.memory.jobType = (target instanceof ConstructionSite) ? 'repair' : 'build';
				creep.memory.jobStartTime = Game.time;
			}

			var err;
			if(target instanceof ConstructionSite) {
				err = creep.build(target);
			} else if (target instanceof StructureController) {
				err = creep.transfer(target, RESOURCE_ENERGY);
			} else if (target instanceof Structure){
				err = creep.repair(target);
			}
			if (err === ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			} else if (err != 0) {
			    //console.log(err + " " + target);
			}
	    }
	},
	getScore: function(target, creep) {
	    return PathFinder.search(creep.pos, {pos:target.pos, range:3}, {swampCost:10, plainCost:2, roomCallback:global.costMatrixCallback}).cost;
	}
};
