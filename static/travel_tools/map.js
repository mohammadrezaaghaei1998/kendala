window.addEventListener('load', async () => {
  const element = document.getElementById('visa-world-map');
  const colorsElement = document.getElementById('visa-map-colors');
  if (!element || !colorsElement || !window.L) return;
  const groups = JSON.parse(colorsElement.textContent);
  const palette = {green:'#39a86b',blue:'#3c91d6',yellow:'#e6b44c',red:'#dc6470'};
  const byCountry = {};
  for (const [color,codes] of Object.entries(groups)) for (const code of codes) byCountry[code]=color;
  const map = L.map(element,{scrollWheelZoom:false,worldCopyJump:true}).setView([20,10],2);
  // This GeoJSON dataset includes ISO3166-1-Alpha-2 country codes.
  try {
    const res=await fetch('https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson');
    if(!res.ok) throw new Error('Map data unavailable');
    const geo=await res.json();
    L.geoJSON(geo,{
      style: feature=>({color:'#fff',weight:.7,fillOpacity:.85,fillColor:palette[byCountry[feature.properties['ISO3166-1-Alpha-2']]]||'#c9ced2'}),
      onEachFeature:(feature,layer)=>{
        const code=feature.properties['ISO3166-1-Alpha-2'];
        const name=feature.properties.ADMIN||feature.properties.name||code;
        layer.bindTooltip(name);
        if(code&&/^[A-Z]{2}$/.test(code))layer.on('click',()=>{
          const p=new URLSearchParams(location.search).get('passport')||'TR';
          location.href='/visa-regulations/?passport='+encodeURIComponent(p)+'&destination='+encodeURIComponent(code)+'&check=1';
        });
      }
    }).addTo(map);
  } catch(e) {
    element.style.display='none';
    const note=document.getElementById('map-message');
    if(note)note.textContent='The map could not load. Use the country links below to explore visa requirements.';
  }
});
