# nesti
A straight forward plugin for adding some very helpful functionalities to nested/tree structure checkbox lists. It was born out of the desire to stop re-writing tree logic in multiple ways and try to consistify the way this is handled. This plugin is built leveraging the https://github.com/jquery-boilerplate/jquery-boilerplate repo (with some minor updates to the boilerplate).

## Features
* Build and display nested tree select structures 
* Logic to handle the three states of a checkbox
* Optional filtering (via text search) 
* Public api for accessing elements and building a list tree structure dynamically

## Dependencies
* jQuery >=1.5.1
* Font Awesome (or whatever icon library you use considering custom toggle elements is an option)

## Getting Started
### 1. Create the tree structure in one of two available ways:
###### The "Classic" Way
Manually create the list _before_ 

The list structure _*must*_ match the following example:
```HTML
<ul id="list">
    <li>
        <input type="checkbox" data-value="Acer" id="acer"> 
        <label for="acer">Acer</label>
    </li>
    <li>
        <i class="fas fa-minus text-small"></i>
        <input type="checkbox" data-value="Apple" id="apple"> 
        <label for="apple">Apple</label>
        <ul>
            <li>
                <i class="fas fa-minus text-small"></i>
                <input type="checkbox" data-value="Asus" id="asus"> 
                <label for="asus">Asus</label>
                <ul>
                    <li>
                        <input type="checkbox" data-value="Dell" id="dell"> 
                        <label for="dell">Dell</label>
                    </li>
                    <li>
                        <input type="checkbox" data-value="Google" id="google"> 
                        <label for="google">Google</label>
                    </li>
                </ul>
            </li>
            <li>
                <input type="checkbox" data-value="HP" id="hp"> 
                <label for="hp">HP</label>
            </li>
        </ul>
    </li>
    <li>
        <input type="checkbox" data-value="Lenovo" id="lenovo"> 
        <label for="lenovo">Lenovo</label>
    </li>
</ul>
```

And then instantiate the plugin on the root list item, _always with an ID_.
```javascript
$("#list").nesti({
    filterable: true,
    collapse: {
        enabled: true
    }
});
```

###### ...Or let Nesti build the tree structure internally (from a reputable source of course)
```javascript
$("#list2").nesti("api.buildList", [
    {
        label: 'Acer',
        value: 'acer',
        items: null
    },
    {
        label: 'Apple',
        value: 'apple',
        items: [
            {
                label: 'Asus',
                value: 'asus',
                items: [...]
            }
        ]
    }
]);
```

> Note: The data that is fed into the `api.buildList` call must always follow the structure and field naming as above.

### 2. Supply the `onChange` callback
```javascript
$("#list").nesti({
    filterable: true,
    collapse: {
        enabled: true
    },
    onChange: () => {
        console.log("DO THE CALLBACK DANCE.");
    }
});
```



## Built With 
* [jQuery Boilerplate](https://github.com/jquery-boilerplate/jquery-boilerplate) - A wonderful, and well-trusted starter boilerplate for jQuery plugins of all different requirements.
