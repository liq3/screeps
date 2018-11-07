module.exports = {

	run: function (creep) {
		var source = Game.getObjectById(creep.memory.sourceId);
		if (source) {
			if (creep.room.energyCapacityAvailable >= 550 || !creep.room.my) {
				let container = source.container
				if (container && !creep.pos.isEqualTo(container)) {
					creep.moveTo(container, {range:0});
				} else if (container) {
					if (Game.time % 6 != 0 || (source.energy > 10*source.ticksToRegeneration) ) {
						if (source.link) {
							if (creep.getActiveBodyparts(WORK)*2 + creep.carry.energy > creep.carryCapacity) {
								let err = creep.transfer(source.link, RESOURCE_ENERGY)
								if (err != OK && err != ERR_FULL) {
									log(`${creep.name} issue transfering energy to link ${err}`)
								}
							}
						}
						let error = creep.harvest(source)
						if (error === ERR_NOT_IN_RANGE) {
							creep.moveTo(source, {range:1})
						}
					} else if (container.hits < container.hitsMax-600 && creep.carry.energy > 12) {
						creep.repair(container);
					}
				} else if (!container) {
					if (creep.pos.getRangeTo(source) > 1) {
						creep.moveTo(source, {range:1});
					} else {
						let sites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
						if (sites.length === 0) {
							if (creep.pos.getRangeTo(source.pos) === 1) {
								source.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
							}
						} else if (sites.length > 0 && creep.carry.energy > 30) {
							creep.build(sites[0]);
						} else {
							let error = creep.harvest(source)
							if (error === ERR_NOT_IN_RANGE) {
								creep.moveTo(source, {range:1})
							}
						}
					}
				}
			} else {
				let error = creep.harvest(source)
				if (error === ERR_NOT_IN_RANGE) {
					creep.moveTo(source, {range:1})
				}
			}
		}
	}
};
