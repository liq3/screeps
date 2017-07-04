var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {

		if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
			gatherEnergy(creep);
	    } else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.gathering = false;
	    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
	        creep.memory.gathering = true;
	    } else {
	        var target = Game.getObjectById(creep.memory.targetId);
			if (target instanceof Structure && target.hits == target.hitsMax) {
				creep.memory.targetId = null;
			}
	        if(!target || Game.time - creep.memory.jobStartTime > 100) {
				let possible = {best:1000000, id:null};
				for (let r in Game.rooms) {
					for (let itr of Game.rooms[r].find(FIND_STRUCTURES, {filter: s => s.hits < s.hitsMax && s.hits < 500000})) {
						let score = creep.pos.getRangeTo(itr);
						if (itr.structureType == STRUCTURE_WALL || itr.structureType == STRUCTURE_RAMPART) {
							if (itr.hits > 10000) {
								score += 1000 + itr.hits / 1000;
							} else {
								score -= 100;
							}
						}
						if ((itr.structureType == STRUCTURE_ROAD || itr.structureType == STRUCTURE_CONTAINER)) {
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

				for (let i in Game.constructionSites) {
					let itr = Game.constructionSites[i];
					let score = creep.pos.getRangeTo(itr);
					if (itr.structureType == STRUCTURE_WALL || itr.structureType == STRUCTURE_RAMPART) {
						score += 200;
					}
					if (itr.structureType == STRUCTURE_ROAD || itr.structureType == STRUCTURE_CONTAINER) {
						score += 100;
					}
					if (itr.structureType == STRUCTURE_SPAWN) {
					    score -= 200;
					}
					if (score < possible.best) {
						possible.best = score;
						possible.id = itr.id;
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
			} else {
				err = creep.repair(target);
			}

			if (err == ERR_NOT_IN_RANGE) {
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
