# nesti
A straight forward plugin for adding some very helpful functionalities to nested/tree structure checkbox lists. It was born out of the desire to stop re-writing tree logic in multiple ways and try to consistify the way this is handled. This plugin is built leveraging the https://github.com/jquery-boilerplate/jquery-boilerplate repo (with some minor updates to the boilerplate).

##Features
* Build and display nested tree select structures 
* Logic to handle the three states of a checkbox
* Optional filtering (via text search) 
* Public api for accessing elements and building a list tree structure dynamically

##Dependencies
* jQuery >=1.5.1
* Font Awesome (or whatever icon library you use considering custom toggle elements is an option)

##Getting Started
###1. Create the tree structure in one of two available ways:
######The "Classic" Way
Manually create the list _before_ 

The list structure _*must*_ match the following example:
```HTML
<ul id="list">
    <li>
        <input type="checkbox" data-value="Coffee"> <label>Coffee</label>
    </li>
    <li>
        <i class="fas fa-minus text-small"></i>
        <input type="checkbox" data-value="Tea"> <label>Tea</label>
        <ul>
            <li>
                <i class="fas fa-minus text-small"></i>
                <input type="checkbox" data-value="Stinker pot"> <label>Black tea</label>
                <ul>
                    <li><input type="checkbox" data-value="Black tea"> <label>Black tea</label></li>
                    <li><input type="checkbox" data-value="Green tea"> <label>Green tea</label></li>
                </ul>
            </li>
            <li>
                <input type="checkbox" data-value="Green tea"> <label>Green tea</label>
            </li>
        </ul>
    </li>
    <li>
        <input type="checkbox" data-value="Milk"> <label>Milk</label>
    </li>
</ul>
```


##Built With 
* [jQuery Boilerplate](https://github.com/jquery-boilerplate/jquery-boilerplate) - A wonderful, and well-trusted starter boilerplate for jQuery plugins of all different requirements.