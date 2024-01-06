export default function AdventureMode(Character, currentVrms, animateCameraToFace) {
    // Use the Character class here
    var count = 0;

    async function loadModel(modelNumber) {
        currentVrms[modelNumber] = new Character(modelNumber);
        return await currentVrms[modelNumber].loadVRM( './'+ modelNumber +'.vrm' );
    }

    async function runLoadTest()
    {
        // random 1-500
        const modelNumber = Math.floor(Math.random() * 500) + 1;
        console.log("Loading model " + modelNumber);
        await loadModel(modelNumber);
        currentVrms[modelNumber].group.position.x = (count * 1) % 10;
        currentVrms[modelNumber].group.position.z = Math.floor((count * 1) / 10);
        count++;
        animateCameraToFace(currentVrms[modelNumber].group);
        await sleep(1000);
        runLoadTest();
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    runLoadTest();
}