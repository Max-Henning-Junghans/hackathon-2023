//import Searchbar from "./searchbar";
//import ResultBox from "./resultBox";
//import {useState} from "react";
import Canvas from "./Canvas";
//from Canvas import Canvas;

function Main() {
    //const [api, updateApi] = useState(() => {
    //    let temp = window.location.href.replace("http://localhost:3000/", "");
    //    temp = temp.replace("site/v1/food/", "");
    //    return temp;
    //})

    return (
        <div className="d-flex justify-content-center">
            <div className="d-flex flex-column">
                <Canvas/>
            </div>
        </div>
    );
}

export default Main;