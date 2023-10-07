import Canvas from "./CanvasMap";
import Canvas from "./Graphs";
import Canvas from "./CanvasHeat";

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