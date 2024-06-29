// The code is a string of numbers, split by the '-' char.
// code[0] is the vessel attribute numbers: locked, hidden, silent, tunnel (0 for no, 1 for yes)
// code[1] is the ID of the vessel this vessel is in
// code[2] is the creator ID
// code[3] is the timestamp it was created and/or updated
function getCode(vessel) {
    return vessel.code.split('-');
}

async function getLinksByLocation(data) {
    return data.map((d, i) => {
        // For now, point source to self
        return {
            source: i,
            target: Number(getCode(d)[1])
        }
    });
}

async function getLinksByCreator(data) {
    return data.map((d, i) => {
        // For now, point source to self
        return {
            source: i,
            target: Number(getCode(d)[2])
        }
    });
}

async function getParadoxes(data) {
    return data.reduce((paradoxAccumulator, d, i) => {
        const parent = Number(getCode(d)[1]);

        if (parent === i) {
            const vessel = {...d};
            paradoxAccumulator.push(vessel);
        }

        return paradoxAccumulator;
    }, []);
}

async function getParadoxGroups(paradoxes) {
    return paradoxes.reduce((groupAccumulator, p, i) => {
        const paradoxVessels = [];
        const searchQueue = [p];
        const searchedVessels = new Set();
        while (searchQueue.length > 0) {
            const currVessel = searchQueue.pop();

            if (searchedVessels.has(currVessel.id)) continue;

            // Search data for all vessels that are located in this vessel
            const childVessels = data.filter((d) => {
                const parent = Number(getCode(d)[1]);

                return parent === currVessel.id;
            });

            // Add these vessels to this paradox's vessels and the search queue
            childVessels.forEach((v) => {
                paradoxVessels.push(v);
                searchQueue.push(v);
            });

            // Add this vessel to the list of searched vessels
            searchedVessels.add(currVessel.id);
        }

        if (!groupAccumulator[p.id]) groupAccumulator[p.id] = [];
        groupAccumulator[p.id] = groupAccumulator[p.id].concat(paradoxVessels);
        return groupAccumulator;
    }, {});
}

async function createForceLinkSimulation(d3, nodes, links) {
    return d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).distance(() => 15))
        .force("charge", d3.forceManyBody().strength(() => -15))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .alphaDecay(0.002);
}
