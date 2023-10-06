//import Searchbar from "./searchbar";
//import ResultBox from "./resultBox";
//import {useState} from "react";

function Main() {
    //const [api, updateApi] = useState(() => {
    //    let temp = window.location.href.replace("http://localhost:3000/", "");
    //    temp = temp.replace("site/v1/food/", "");
    //    return temp;
    //})

    return (
        <div className="d-flex justify-content-center">
            <div className="d-flex flex-column">
                MOIN!!!
                //<Searchbar update={updateApi}/>
                //<ResultBox url={"http://127.0.0.1:5000/api/v1/food/" + api}/>
            </div>
        </div>
    );
}

export default Main;