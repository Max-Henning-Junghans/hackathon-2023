import React, { useRef, useEffect } from 'react'
import Plot from 'react-plotly.js';

function Graphs(props) {
    return (
        <Plot
        data={[
		{
			x: [1, 2, 3, 4, 5, 6],
			y: [2, 6, 3, 1, 2, 3],
			type: 'scatter+markers',
			mode: 'lines',
			marker: {color: 'red'},
			name: 'Test'
		},
			x: [1, 2, 3, 4, 5, 6],
			y: [2, 6, 3, 1, 2, 3],
			type: 'scatter',
			mode: 'lines',
			marker: {color: 'green'},
			name: 'Moin'
        ]}
        layout={ {width: 320, height: 240, title: 'A Fancy Plot'} }
        />
    );
}

export default Graphs;