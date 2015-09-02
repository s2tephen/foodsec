# Food Security
Visualizations based on USDA's Quarterly Food-at-Home Price Database and other food security-related datasets, created for [CMS.631 (Data Storytelling Studio)](http://cms631.datatherapy.org) and [11.188 (Urban Planning and Social Science Laboratory)](http://web.mit.edu/11.188/www/index.html). These projects were iterations on the same concept/data, but explored different means of presentation and got better in fidelity.

## [Small Multiples Line Chart](http://stephensuen.com/foodsec/smlines)

The Quarterly Food-at-Home Price Database estimates the price of different groceries (in $/100g) by food group and region. This visualization takes the data around fruit and vegetable prices in Boston and graphs them as small multiples. A more [in-depth write-up](http://cms631.datatherapy.org/2015/04/16/how-much-do-fruits-vegetables-cost-in-boston) can be found on the CMS.631 blog.

This was inspired by this [Quartz chart on liquor consumption by nation](https://qzprod.files.wordpress.com/2014/01/liquor-consumption2.png?w=640), where the small multiples all share axes/ticks, with an annotation at the end to indicate the current value. More work will be done on the underlying code, with the goal of abstracting it out to turn into some sort of online small multiple creation tool.

## [Map](http://stephensuen.com/foodsec/map)

Here, we combined the Quarterly Food-at-Home Price Database dataset with the USDA's Thrifty Food Plan, a meal plan of minimum viable nutrition. The Thrifty Food Plan is used to calculate how much a household gets in SNAP benefits, and is broken down by necessary food group weight. By using these datasets together, we calculated how much the recommended intake would actually cost around the U.S. For this iteration we were only able to look at fruits and vegetables. [Longer write-up here.](http://cms631.datatherapy.org/2015/04/28/price-of-recommended-fruitvegetable-consumption-2010)

## [Final](http://stephensuen.com/foodsec/final)

This iteration took the same approach from the previous map but applied it to all food groups. The data was then loaded into ArcGIS and turned into a interactive choropleth map using D3/GeoJSON. The data is filterable by sex/age and then split into quintiles for easy reading/analysis. The goal here was to compare the actual cost of the Thrifty Food Plan (variable depending on where you live, due to variation in food prices) to the amount being allotted for SNAP benefits (a fixed amount). We can then see where in the U.S. SNAP is inadequate and where it is more than adequate.
