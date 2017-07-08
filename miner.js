module.exports = {

 	run: function (creep) {
		var source = Game.getObjectById(creep.memory.sourceId);
        if(source) {
            let container = Game.getObjectById(creep.memory.containerId);
            if (!container) {
                let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {filter: s => s.structureType == STRUCTURE_CONTAINER});
                if (containers.length > 0) {
                    container = containers[0];
                    creep.memory.containerId = container.id;
                }
            }

            if (container && creep.pos.getRangeTo(container) > 0) {
                creep.moveTo(container, {range:0});
            } else if (!container) {
                if (creep.pos.getRangeTo(source) > 1) {
                    creep.moveTo(source, {range:1});
                } else {
                    let sites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
                    if (sites.length == 0) {
                        if (creep.pos.getRangeTo(source.pos) == 1) {
                            source.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                        }
                    } else if (sites.length > 0 && creep.carry.energy > 30) {
                        creep.build(sites[0]);
                    }
                }
            }
            if (container && container.hits < container.hitsMax && creep.carry.energy > 30) {
                creep.repair(container);
            } else {
                let error = creep.harvest(source);
            }
        }
	}
};
