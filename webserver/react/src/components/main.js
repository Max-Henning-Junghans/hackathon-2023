import CanvasMap from "./CanvasMap";
import Graphs from "./Graphs";
import CanvasHeat from "./CanvasHeat";

function Main() {
    return (
        <div className="d-flex justify-content-center">
            <div className="d-flex flex-column">
                <CanvasMap/>
                <Graphs/>
                <CanvasHeat/>
            </div>
        </div>
    );
}

export default Main;