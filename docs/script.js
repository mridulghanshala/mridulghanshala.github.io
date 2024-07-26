var selectedYear = 'combined';
let selectedCountry = '';
let scatterplotData = {};

//TO DO: there is one overlapping color in the legend. fix this if time permits
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

const margin = {
    top: 60,
    right: 80,
    bottom: 80,
    left: 60,
};
const width = 800 - margin.left - margin.right;
const height = 575 - margin.top - margin.bottom;

const svg = d3.select('#scatterplot')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 20)
    .append('g')
    .attr('transform', `translate(${margin.left + 20}, ${margin.top})`);

function toggleData(year) {
    selectedYear = year;
    d3.csv(`${selectedYear}_rankings.csv`, (d) => ({
            name: d.name,
            year: selectedYear,
            scores_overall: +d.scores_overall,
            scores_teaching: +d.scores_teaching,
            scores_research: +d.scores_research,
            location: d.location,
        }))
        .then((data) => {
            if (selectedYear === 'combined') {
                scatterplotData[selectedYear] = data.slice(0, 750);
            }
            else {
                scatterplotData[selectedYear] = data.slice(0, 75);
            }

            const countries = [
                ...new Set(scatterplotData[selectedYear].map((d) => d.location)),
            ];

            const countrySelect = document.getElementById('country-select');
            countrySelect.innerHTML = '<option value="" >Select a Country</option>';
            countries.forEach((country) => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countrySelect.appendChild(option);
            });

            const years = [ 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
            years.reverse();
            const yearSelect = document.getElementById('year-select');
            yearSelect.innerHTML = '<option value="" >Select a Particular Year</option>';
            years.forEach((year) => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
            updateScatterplot();
        })
        .catch((error) => {
            console.error('Error loading data:', error);
        });
}

function resetChart() {
    selectedYear = 'combined';
    selectedCountry = '';
    document.getElementById('country-select').value = '';
    document.getElementById('year-select').value = '';
    updateScatterplot();
}

function updateCountryData(selectedCountry) {
    selectedCountry = selectedCountry || document.getElementById('country-select').value;
    console.log('Updated country:', selectedCountry);
    if (selectedCountry === '') {
        const filteredData = scatterplotData[selectedYear]
        updateScatterplot(filteredData);
    }
    else {
        const filteredData = scatterplotData[selectedYear].filter((d) => d.location === selectedCountry).slice(0, 75);
        updateScatterplot(filteredData);
    }

}

function updateYearData() {
    let year = document.getElementById('year-select').value;
    if (year === '') {
        year = 'combined';
    }
    selectedYear = year;
    selectedCountry = '';
    document.getElementById('country-select').value = '';
    if (!scatterplotData[year]) {
        d3.csv(`${year}_rankings.csv`, (d) => ({
            name: d.name,
            year: year,
            scores_overall: +d.scores_overall,
            scores_teaching: +d.scores_teaching,
            scores_research: +d.scores_research,
            location: d.location,
        }))
        .then((data) => {
            scatterplotData[year] = data.slice(0, 75);
            resetCountryOptions(scatterplotData[year])
            updateScatterplot(scatterplotData[year]);
        })
        .catch((error) => {
            console.error('Error loading data:', error);
        });
    }
    else {
        resetCountryOptions(scatterplotData[year])
        updateScatterplot(scatterplotData[year]);
    }
}

function resetCountryOptions(scatterplotData) {
    const countries = [
        ...new Set(scatterplotData.map((d) => d.location)),
    ];
    const countrySelect = document.getElementById('country-select');
    countrySelect.innerHTML = '<option value="" >Select a Country</option>';
    countries.forEach((country) => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });
}

function updateScatterplot(data) {
    svg.selectAll('*').remove();
    const xScale = d3.scaleLinear()
        .domain([30, 100])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([30, 100])
        .range([height, 0]);

    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '5px')
        .style('border-radius', '5px')
        .style('font-size', '12px');

    svg.selectAll('circle')
        .data(data || scatterplotData[selectedYear])
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.scores_teaching))
        .attr('cy', (d) => yScale(d.scores_research))
        .attr('r', 5)
        .style('fill', (d) => colorScale(d.location))
        .on('mouseover', (event, d) => {
            tooltip.style('visibility', 'visible')
                .html(`<strong>${d.name}</strong><br>Country: ${d.location}<br>Overall Score: ${d.scores_overall}`)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 10}px`);
        })
        .on('mouseout', () => {
            tooltip.style('visibility', 'hidden');
        });

    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .call(d3.axisLeft(yScale));

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + (margin.bottom / 2))
        .attr('text-anchor', 'middle')
        .text('Teaching Score');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left)
        .attr('text-anchor', 'middle')
        .text('Research Score');

    svg.append('text')
        .attr('id', 'scatterplot-title')
        .attr('x', width / 2)
        .attr('y', 7)
        .attr('text-anchor', 'middle')
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .text('Title');


    const legendDiv = document.getElementById('legend');
    legendDiv.innerHTML = '';

    const countries = [...new Set(scatterplotData[selectedYear].map((d) => d.location))];

    countries.forEach((country) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const legendColor = document.createElement('div');
        legendColor.className = 'legend-color';
        legendColor.style.backgroundColor = colorScale(country);

        const legendLabel = document.createElement('div');
        legendLabel.textContent = country;

        legendItem.appendChild(legendColor);
        legendItem.appendChild(legendLabel);

        legendDiv.appendChild(legendItem);
    });

    const legendHeight = legendDiv.offsetHeight;
    svg.attr('height', Math.max(height + margin.top + margin.bottom, legendHeight));

    d3.selectAll('.annotation-group').remove();
    console.log(selectedYear)
    svg.select('#scatterplot-title')
    .text(`Year ${selectedYear}`);

    if (selectedYear === 'combined') {
        const annotationscombo = [{
            note: {
                title: 'US Universtites Top Ranking Scores',
                label: 'This group highlights the top universities from 2011-2024 with US Universities dominating the scores',
                wrap: 300,
            },
            connector: {
                end: 'arrow',
            },
            x: width - 50,
            y: 90,
            dx: -30,
            dy: 250,
        }, ];
        const annotationcombo = d3.annotation().type(d3.annotationCallout).annotations(annotationscombo);
        svg.append('g').attr('class', 'annotation-group').call(annotationcombo);
    }
    else if (selectedYear === '2024') {
        const annotations2024 = [{
            note: {
                title: 'UIUC Highest Rank so far',
                label: 'UIUC was consistently scoring 71-75 overall but reached 77.9 this year, a record high.',
                wrap: 300,
            },
            connector: {
                end: 'arrow',
            },
            x: width - 285,
            y: 110,
            dx: -50,
            dy: 250,
        }, ];
        const annotation2024 = d3.annotation().type(d3.annotationCallout).annotations(annotations2024);
        svg.append('g').attr('class', 'annotation-group').call(annotation2024);
    } else if (selectedYear === '2023') {
        const annotations2023 = [{
            note: {
                title: 'Harvard best university from 2021-2023',
                label: 'Harvard remains the highest scoring university from 2021-2023',
                wrap: 200,
            },
            connector: {
                end: 'arrow',
            },
            x: width - 50,
            y: 5,
            dx: -50,
            dy: 250,
        }, ];
        const annotation2023 = d3.annotation().type(d3.annotationCallout).annotations(annotations2023);
        svg.append('g').attr('class', 'annotation-group').call(annotation2023);
    } else if (selectedYear === '2022') {
        const annotations2022 = [{
            note: {
                title: 'Top British Universities',
                label: 'Oxford and Cambridge are the top British universities in the rankings with very close scores consistently.',
                wrap: 200,
            },
            connector: {
                end: 'arrow',
            },
            x: width - 81,
            y: 5,
            dx: -10,
            dy: 140,
        }, ];

        const annotation2022 = d3.annotation().type(d3.annotationCallout).annotations(annotations2022);
        svg.append('g').attr('class', 'annotation-group').call(annotation2022);
    } else if (selectedYear === '2021') {
        //This kinda works idk 
        const lowestOverallScore2021 = scatterplotData['2021'].reduce((min, d) => (d.scores_overall < min ? d.scores_overall : min), Infinity);
        const lowestOverallScoreData2021 = scatterplotData['2021'].find((d) => d.scores_overall === lowestOverallScore2021);
        if (lowestOverallScoreData2021) {
            const annotations2021 = [{
                note: {
                    title: 'Last time McMaster was ranked',
                    label: `Last time Mc Master was ranked in top 75 was in 2021`,
                    wrap: 200,
                },
                connector: {
                    end: 'arrow',
                },
                x: xScale(lowestOverallScoreData2021.scores_teaching) - 20,
                y: yScale(lowestOverallScoreData2021.scores_research)- 26,
                dx: 150,
                dy: -20,
            }, ];

            const annotation2021 = d3.annotation().type(d3.annotationCallout).annotations(annotations2021);
            svg.append('g').attr('class', 'annotation-group').call(annotation2021);
        }
    } else if (selectedYear === '2020') {
        const annotations2020 = [{
            note: {
                title: 'Lowest score in top 75',
                label: 'With a score of 65.4, McMaster is the lowest ranked in 2020',
                wrap: 200,
            },
            connector: {
                end: 'arrow',
            },
            x: width - 520,
            y: 315,
            dx: 120,
            dy: 30,
        }, ];

        const annotation2020 = d3.annotation().type(d3.annotationCallout).annotations(annotations2020);
        svg.append('g').attr('class', 'annotation-group').call(annotation2020);
    } else if (selectedYear === '2019') {
        const annotations2019 = [{
            note: {
                title: 'UIUC Worst Year',
                label: 'Big drop in UIUC score to 72.3',
                wrap: 400,
            },
            connector: {
                end: 'arrow',
            },
            x: width - 350,
            y: 170,
            dx: 100,
            dy: -130,
        }, ];

        const annotation2019 = d3.annotation().type(d3.annotationCallout).annotations(annotations2019);
        svg.append('g').attr('class', 'annotation-group').call(annotation2019);
    }
}

toggleData('combined');