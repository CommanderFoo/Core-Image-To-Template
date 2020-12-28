/*The MIT License (MIT)

Copyright (c) 2020 pixeldepth.net

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

class Merge_Pixels {

	constructor(data){
		this.data_cache = JSON.parse(JSON.stringify(data));
		this.width = this.data_cache[0].length;
		this.height = this.data_cache.length;
		
		// <-

		for(let y = 0; y < this.height; ++ y){
			for(let x = 0; x < this.width; ++ x){	
				let pixel_data = this.data_cache[y][x];
				let prev = this.data_cache[y][x - 1];

				if(prev){
					if(prev.combined == pixel_data.combined || Math.abs(pixel_data.combined - prev.combined) < 3){
						if(prev.x_parent){
							prev.x_parent.width ++;
							pixel_data.x_parent = prev.x_parent;
						} else {
							pixel_data.x_parent = prev;
							prev.width = 2;
							prev.is_parent = true
						}
					}
				}
			}
		}

		// ^
		
		for(let y = 0; y < this.height; ++ y){
			for(let x = 0; x < this.width; ++ x){	
				let pixel_data = this.data_cache[y][x];
				
				if(this.data_cache[y - 1]){
					let prev = this.data_cache[y - 1][x];

					if(prev.x_parent || pixel_data.is_parent || prev.is_parent){
						continue;
					}

					if(prev.combined == pixel_data.combined || Math.abs(pixel_data.combined - prev.combined) < 3){
						if(prev.y_parent){
							prev.y_parent.height ++;
							pixel_data.y_parent = prev.y_parent;
						} else {
							pixel_data.y_parent = prev;
							prev.height = 2;
						}
					}
				}
			}
		}

		return this.data_cache;
	}

}

class Pixel_Art_To_Template {
	
	static get_unique_id(){
		return this.unique_start_id ++;
	}

	static structure_data(data, width, height){
		let structured = [];

		for(let y = 0; y < height; ++ y){
			structured[y] = [];

			for(let x = 0; x < width; ++ x){
				let index = (y * width + x) * 4;

				structured[y][x] = {

					r: data[index],
					g: data[index + 1],
					b: data[index + 2],
					a: data[index + 3],
					combined: data[index] + data[index + 1] + data[index + 2] + data[index + 3],
					// a string to match others (for Maximal Rectangle)
					compare: data[index] +":"+ data[index + 1] +":"+ data[index + 2] +":"+ data[index + 3] //MR
				};
			}
		}

		return structured;
	}

	// create list of colors that are being used by this image (don't include duplicates)
	static get_colors(data,width,height){ //MR
		let _colors = [];
		for(let y = 0; y < height; ++ y){

			for(let x = 0; x < width; ++ x){
				
				if( !_colors.includes(data[y][x].compare) ){
					_colors.push(data[y][x].compare)
				}
			}
		}
		return _colors;
	}
	
	// mark rectangle so won't be counted again MR
	static markRect({ x1, y1, x2, y2 }) {
		for (let i = x1; i <= x2; ++i) {
			for (let j = y1; j <= y2; ++j) {
				this._data[j][i].compare = 0;
			}
		}
	}
	
	static findNextRect(_needle) { //MR
		// find top left corner
		let foundCorner = false;
		const rect = {color:_needle, x1: 0, x2: this._width-1, y1: 0, y2: this._height-1 };
		for (let i = 0; i < this._width; ++i) {
			for (let j = 0; j < this._height; ++j) {
				if (this._data[j][i].compare === _needle) {
					rect.x1 = i;
					rect.y1 = j;
					foundCorner = true;
					break;
				}
			}
			if (foundCorner){ break;}
		}		
		// find bottom right corner
		for (let i = rect.x1; i <= rect.x2; ++i) {
			if (this._data[rect.y1][i].compare !== _needle) {
				rect.x2 = i-1;
				return rect;
			}
			for (let j = rect.y1; j <= rect.y2; ++j) {
				if (this._data[j][i].compare !== _needle) {
					rect.y2 = j-1;
					break;
				}
			}
		}
		return rect;
	}	

	// search through array to combine meshes both width and height to lessen mesh count
	static MaximalRectangle(_color){		
		
		// get the area covered by rectangles
		let totalRectArea = 0;
		
		for (let i = 0; i < this._width; ++i) {
			for (let j = 0; j < this._height; ++j) {
				// 56 is our "blank(0)"
				totalRectArea += this._data[j][i].compare == _color ? 1 : 0;
			}
		}

		this._rectArea = 0;

		// find all rectangle until their area matches the total
		while (this._rectArea < totalRectArea) {
			const rect = this.findNextRect(_color);
			this._rects.push(rect);
			this.markRect(rect);
			this._rectArea += (rect.x2 - rect.x1 + 1) * (rect.y2 - rect.y1 + 1);
		}
	}
	

	static generate(image_data, file_name){
		this.unique_start_id = +(new Date());

		if(image_data){
			let data = image_data.data;
			let width = image_data.width;
			let height = image_data.height;

			this._width = width; //MR
			this._height = height;
			
			/* Display the pixel art's width and height (MR) */
			$("#artwidth").val(this._width);
			$("#artheight").val(this._height);
		
			let structured_data = this.structure_data(data, width, height);
			let merged_data = new Merge_Pixels(structured_data);
			
			// globalize this._data for MR access
			this._data = structured_data; //MR
			
			// get colors list for Maximum Rectangle comparisons
			let colors_array = this.get_colors(structured_data,width,height); //MR
			//$("#output").append(colors_array.toString());

			for(let aa = 0; aa < colors_array.length; ++aa)// run through all color codes
			{
				if(colors_array[aa] != "0:0:0:0"){// ignore blank/empty
					this.MaximalRectangle( colors_array[aa] );
				}
				// search for each color, to combine meshes for "Maximal Rectangle"
				//let maximal_data = this.maximal_rectangle(colors_array[aa],structured_data,width,height);
			}
			
			// Test our Maximal Rectangle array 			
			// print out the new array to copy
			if(0>1)
			{
				$("#output").text(this._rects.length + " meshes via Maximal Rectangle: ");
				let _build = "<br />";
				
				for(var i = 0; i < this._rects.length; i++){
					
					let _width = this._rects[i]["x2"] - this._rects[i]["x1"] + 1;
					
					let _height = this._rects[i]["y2"] - this._rects[i]["y1"] + 1;
					
					_build += "{";
					
					_build += this._rects[i]["color"] + ",";

					_build += this._rects[i]["x1"] + ","

					_build += this._rects[i]["y1"] + ",";

					_build += _width + ",";
					
					_build += _height + "}";

					_build += i < this._rects.length-1 ? "," : "";

				}
				$("#output").append(_build);
				// color, x, y, width, height
				//{color:_needle, x1: 0, x2: this.width-1, y1: 0, y2: this.height-1 };
			}



			let asset_id = this.get_unique_id();
			let root_id = this.get_unique_id();
			let mesh_asset_id = this.get_unique_id();
			let merged_id = this.get_unique_id();
			let material_asset_id = this.get_unique_id();

			let child_ids = [];
			let child_str = "";

			let non_merged_counter = width * height;
			let merged_counter = 0;
			let alpha_cutoff = parseInt($("#alphacutoff").val(), 10);
			let object_scale = parseFloat($("#objectscale").val());
			let is_ui = ($("#ui").prop("checked"))? true : false;

			// rect = {color:_needle, x1: 0, x2: this._width-1, y1: 0, y2: this._height-1 };
			
			for(let ff = 0; ff < this._rects.length; ++ ff){
				//let pixel_data = merged_data[y][x];
				let pixel_width = this._rects[ff].x2 - this._rects[ff].x1 + 1 || 1;
				let pixel_height = this._rects[ff].y2 - this._rects[ff].y1 + 1 || 1;
				
				/*$("#output").append("x1: "+this._rects[ff].x1 + "<br />");
				$("#output").append("x2: "+this._rects[ff].x2+"<br />");
				$("#output").append("y1: "+this._rects[ff].y1+"<br />");
				$("#output").append("y2: "+this._rects[ff].y2+"<br />");
				$("#output").append("color: "+this._rects[ff].color+"<br />");*/				
				let child_id = this.get_unique_id()
				let str = this._rects[ff].color;// get color string	
				//$("#output").append("str: "+ str +"<br />");
				let pop = str.split(":");
				let r = pop[0] / 255;
				let g = pop[1] / 255;
				let b = pop[2] / 255;
				let a = pop[3] / 255;
				//$("#output").append("rgba: "+ r +""+ g + "" + b + "" + a);
				
				let pixel_x = this._rects[ff].x1;
				let pixel_y = this._rects[ff].y1;
				let scale_x = 0;
				let scale_y = 0;

			
				if(is_ui){
					pixel_x = (((pixel_x + (pixel_width / 2)) * (object_scale / 10))).toFixed(4);
					pixel_y = (((pixel_y + (pixel_height / 2)) * (object_scale / 10))).toFixed(4);
					scale_x = Math.round(pixel_width * (object_scale / 10));
					scale_y = Math.round(pixel_height * (object_scale / 10));
				} else {		
				
					pixel_x = ((pixel_x + (pixel_width / 2)) * 10);
					
					pixel_y = ((pixel_y + (pixel_height / 2)) * 10);
					
					scale_x = pixel_width * .1;
					scale_y = pixel_height * .1;
				}
				child_ids.push(child_id);

				child_str += "\t\t\tObjects {\n";
				child_str += "\t\t\t\tId: " + child_id + "\n";
				child_str += "\t\t\t\tName: \"Pixel\"\n";
				child_str += "\t\t\t\tTransform {\n";
				child_str += "\t\t\t\t\tLocation {\n";

				if(!is_ui){
					child_str += "\t\t\t\t\t\tX: " + pixel_x + "\n";
					child_str += "\t\t\t\t\t\tY: 0\n";
					child_str += "\t\t\t\t\t\tZ: " + pixel_y + "\n";	
				}

				child_str += "\t\t\t\t\t}\n";
				child_str += "\t\t\t\t\tRotation {\n";

				if(!is_ui){
					child_str += "\t\t\t\t\t\tRoll: 90\n";
				}

				child_str += "\t\t\t\t\t}\n";
				child_str += "\t\t\t\t\tScale {\n";
				if(!is_ui){
					child_str += "\t\t\t\t\t\tX: " + scale_x + "\n";
					child_str += "\t\t\t\t\t\tY: " + scale_y + "\n";
					child_str += "\t\t\t\t\t\tZ: .1\n";
				}

				child_str += "\t\t\t\t\t}\n"
				child_str += "\t\t\t\t}\n";

				if(!is_ui){
					child_str += "\t\t\t\tParentId: " + merged_id + "\n";
				} else {
					child_str += "\t\t\t\tParentId: " + root_id + "\n";
				}

				if(!is_ui){
					child_str += "\t\t\t\tUnregisteredParameters {\n";
						child_str += "\t\t\t\t\tOverrides {\n";
							child_str += "\t\t\t\t\t\tName: \"ma:Shared_BaseMaterial:id\"\n";
							child_str += "\t\t\t\t\t\tAssetReference {\n";
								child_str += "\t\t\t\t\t\t\tId: " + material_asset_id + "\n";
							child_str += "\t\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\tOverrides {\n";
							child_str += "\t\t\t\t\t\tName: \"ma:Shared_BaseMaterial:color\"\n";
							child_str += "\t\t\t\t\t\tColor {\n";
								child_str += "\t\t\t\t\t\t\tR: " + parseFloat(parseFloat(r).toFixed(4)) + "\n";
								child_str += "\t\t\t\t\t\t\tG: " + parseFloat(parseFloat(g).toFixed(4)) + "\n";
								child_str += "\t\t\t\t\t\t\tB: " + parseFloat(parseFloat(b).toFixed(4)) + "\n";
								child_str += "\t\t\t\t\t\t\tA: " + parseFloat(parseFloat(a).toFixed(4)) + "\n";
							child_str += "\t\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\t}\n";
					child_str += "\t\t\t\t}\n";
				}
					
				child_str += "\t\t\t\tCollidable_v2 {\n";
				child_str += "\t\t\t\t\tValue: \"mc:ecollisionsetting:forceoff\"\n";
				child_str += "\t\t\t\t}\n";
				child_str += "\t\t\t\tVisible_v2 {\n";
				child_str += "\t\t\t\t\tValue: \"mc:evisibilitysetting:inheritfromparent\"\n";
				child_str += "\t\t\t\t}\n";

				if(!is_ui){
					child_str += "\t\t\t\tCoreMesh {\n";
						child_str += "\t\t\t\t\tMeshAsset {\n";
							child_str += "\t\t\t\t\t\tId: " + mesh_asset_id + "\n";
						child_str += "\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\tTeams {\n";
							child_str += "\t\t\t\t\t\tIsTeamCollisionEnabled: true\n";
							child_str += "\t\t\t\t\t\tIsEnemyCollisionEnabled: true\n";
						child_str += "\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\tEnableCameraCollision: true\n";
						child_str += "\t\t\t\t\tStaticMesh {\n";
							child_str += "\t\t\t\t\t\tPhysics {\n"
								child_str += "\t\t\t\t\t\t\tMass: 100\n";
								child_str += "\t\t\t\t\t\t\tLinearDamping: 0.01\n";
							child_str += "\t\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\t}\n";
					child_str += "\t\t\t\t}\n";
				} else {
					child_str += "\t\t\t\tControl {\n";
						child_str += "\t\t\t\t\tWidth: " + scale_x + "\n";
						child_str += "\t\t\t\t\tHeight: " + scale_y + "\n";
						child_str += "\t\t\t\t\tUIX: " + pixel_x + "\n";
						child_str += "\t\t\t\t\tUIY: " + pixel_y + "\n";
						child_str += "\t\t\t\t\tRenderTransformPivot {\n";
							child_str += "\t\t\t\t\t\tAnchor {\n";
								child_str += "\t\t\t\t\t\t\tValue: \"mc:euianchor:middlecenter\"\n";
							child_str += "\t\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\tImage {\n";
							child_str += "\t\t\t\t\t\tBrush {\n";
							child_str += "\t\t\t\t\t\t}\n";
							child_str += "\t\t\t\t\t\tColor {\n";
								child_str += "\t\t\t\t\t\t\tR: " + parseFloat(parseFloat(r).toFixed(4)) + "\n";
								child_str += "\t\t\t\t\t\t\tG: " + parseFloat(parseFloat(g).toFixed(4)) + "\n";
								child_str += "\t\t\t\t\t\t\tB: " + parseFloat(parseFloat(b).toFixed(4)) + "\n";
								child_str += "\t\t\t\t\t\t\tA: " + parseFloat(parseFloat(a).toFixed(4)) + "\n";
							child_str += "\t\t\t\t\t\t}\n";
							child_str += "\t\t\t\t\t\tTeamSettings {\n";
							child_str += "\t\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\tAnchorLayout {\n";
							child_str += "\t\t\t\t\t\tSelfAnchor {\n";
								child_str += "\t\t\t\t\t\t\tAnchor {\n";
									child_str += "\t\t\t\t\t\t\t\tValue: \"mc:euianchor:middlecenter\"\n";
								child_str += "\t\t\t\t\t\t\t}\n";
							child_str += "\t\t\t\t\t\t}\n";
							child_str += "\t\t\t\t\t\tTargetAnchor {\n";
								child_str += "\t\t\t\t\t\t\tAnchor {\n";
									child_str += "\t\t\t\t\t\t\t\tValue: \"mc:euianchor:topleft\"\n";
								child_str += "\t\t\t\t\t\t\t}\n";
							child_str += "\t\t\t\t\t\t}\n";
						child_str += "\t\t\t\t\t}\n";
					child_str += "\t\t\t\t}\n";
				}
				child_str += "\t\t\t}\n";
			}
		
			let file_n = file_name;

			if(is_ui){
				file_n = "UI - " + file_n + " " +  this._rects.length;
			}

			let tpl = "";

			tpl += "Assets {\n";
				tpl += "\tId: " + asset_id + "\n";
				tpl += "\tName: \"" + file_n + "\"\n";
				tpl += "\tPlatformAssetType: 5\n";
				tpl += "\tTemplateAsset {\n";
					tpl += "\t\tObjectBlock {\n";
						tpl += "\t\t\tRootId: " + root_id + "\n";
						tpl += "\t\t\tObjects {\n";
							tpl += "\t\t\t\tId: " + root_id + "\n";
							tpl += "\t\t\t\tName: \"Pixel Art\"\n";
							tpl += "\t\t\t\tTransform {\n";
								tpl += "\t\t\t\t\tScale {\n";
									if(!is_ui){
										tpl += "\t\t\t\t\t\tX: " + object_scale + "\n";
										tpl += "\t\t\t\t\t\tY: " + object_scale + "\n";
										tpl += "\t\t\t\t\t\tZ: " + object_scale + "\n";
									}
								tpl += "\t\t\t\t\t}\n";
							tpl += "\t\t\t\t}\n";
						
							tpl += "\t\t\t\tParentId: " + this.get_unique_id() + "\n";

							if(!is_ui){
								tpl += "\t\t\t\tChildIds: " + merged_id + "\n";
							} else {
								for(let c = 0; c < child_ids.length; c ++){
									tpl += "\t\t\t\tChildIds: " + child_ids[c] + "\n";
								}
							}

							tpl += "\t\t\t\tCollidable_v2 {\n";
								tpl += "\t\t\t\t\tValue: \"mc:ecollisionsetting:forceoff\"\n";
							tpl += "\t\t\t\t}\n";
							tpl += "\t\t\t\tVisible_v2 {\n";
								tpl += "\t\t\t\t\tValue: \"mc:evisibilitysetting:inheritfromparent\"\n";
							tpl += "\t\t\t\t}\n";

							if(is_ui){
								tpl += "\t\t\t\tControl {\n";
									tpl += "\t\t\t\t\tWidth: " + (pixel_width * (object_scale / 10)).toFixed(0) + "\n";
									tpl += "\t\t\t\t\tHeight: " + (pixel_height * (object_scale / 10)).toFixed(0) + "\n";
									tpl += "\t\t\t\t\tRenderTransformPivot {\n";
										tpl += "\t\t\t\t\t\tAnchor {\n";
											tpl += "\t\t\t\t\t\t\tValue: \"mc:euianchor:middlecenter\"\n";
										tpl += "\t\t\t\t\t\t}\n";
									tpl += "\t\t\t\t\t}\n";
									tpl += "\t\t\t\t\tPanel {\n";
									tpl += "\t\t\t\t\t}\n";
									tpl += "\t\t\t\t\tAnchorLayout {\n";
										tpl += "\t\t\t\t\t\tSelfAnchor {\n";
											tpl += "\t\t\t\t\t\t\tAnchor {\n";
												tpl += "\t\t\t\t\t\t\t\tValue: \"mc:euianchor:middlecenter\"\n";
											tpl += "\t\t\t\t\t\t\t}\n";
										tpl += "\t\t\t\t\t\t}\n";
										tpl += "\t\t\t\t\t\tTargetAnchor {\n";
											tpl += "\t\t\t\t\t\t\tAnchor {\n";
												tpl += "\t\t\t\t\t\t\t\tValue: \"mc:euianchor:middlecenter\"\n";
											tpl += "\t\t\t\t\t\t\t}\n";
										tpl += "\t\t\t\t\t\t}\n";
									tpl += "\t\t\t\t\t}\n";
								tpl += "\t\t\t\t}\n";
							} else {
								tpl += "\t\t\t\tFolder {\n";
									tpl += "\t\t\t\t\tIsFilePartition: true\n";
								tpl += "\t\t\t\t}\n";
							}

						tpl += "\t\t\t}\n";
				
						if(!is_ui){
							tpl += "\t\t\tObjects {\n";
								tpl += "\t\t\t\tId: " + merged_id + "\n";
								tpl += "\t\t\t\tName: \"Merged Model\"\n";
								tpl += "\t\t\t\tTransform {\n";
									tpl += "\t\t\t\t\tScale {\n";
									tpl += "\t\t\t\t\t\tX: 1\n";
									tpl += "\t\t\t\t\t\tY: 1\n";
									tpl += "\t\t\t\t\t\tZ: 1\n";
								tpl += "\t\t\t\t\t}\n";
							tpl += "\t\t\t\t}\n";
						
							tpl += "\t\t\t\tParentId: " + root_id + "\n";
						
							for(let c = 0; c < child_ids.length; c ++){
								tpl += "\t\t\t\tChildIds: " + child_ids[c] + "\n";
							}
						}

						if(!is_ui){
							tpl += "\t\t\t\tCollidable_v2 {\n";
								tpl += "\t\t\t\t\tValue: \"mc:ecollisionsetting:forceoff\"\n";
							tpl += "\t\t\t\t}\n";
							tpl += "\t\t\t\tVisible_v2 {\n";
								tpl += "\t\t\t\t\tValue: \"mc:evisibilitysetting:inheritfromparent\"\n";
							tpl += "\t\t\t\t}\n";
							tpl += "\t\t\t\tFolder {\n";
								tpl += "\t\t\t\t\tModel {\n";
								tpl += "\t\t\t\t\t\t\AggressiveMerge: true\n";
								tpl += "\t\t\t\t\t\}\n";
							tpl += "\t\t\t\t}\n";

							tpl += "\t\t\t}\n";
						}

					tpl += child_str
					
					tpl += "\t\t}\n";

					if(!is_ui){
						let pixel_material_name = "Basic Material"
						let pixel_material_asset_id = "mi_basic_pbr_material_001";

						if($("#material").prop("checked")){
							pixel_material_name = "Emissive Glow Opaque"
							pixel_material_asset_id = "fxma_opaque_emissive"
						}

						let plane_name = "Plane 1m - One Sided";
						let plane_asset_id = "sm_plane_1m_001";
						
						if($("#doublesided").prop("checked")){
							plane_name = "Plane 1m - Two Sided"
							plane_asset_id = "sm_plane_1m_002"
						}

						tpl += "\t\tAssets {\n";
							tpl += "\t\t\tId: " + mesh_asset_id + "\n";
							tpl += "\t\t\tName: \"" + plane_name + "\"\n";
							tpl += "\t\t\tPlatformAssetType: 1\n";
							tpl += "\t\t\tPrimaryAsset {\n";
								tpl += "\t\t\t\tAssetType: \"StaticMeshAssetRef\"\n";
								tpl += "\t\t\t\tAssetId: \"" + plane_asset_id + "\"\n";
							tpl += "\t\t\t}\n";
						tpl += "\t\t}\n";
						tpl += "\t\tAssets {\n";
							tpl += "\t\t\tId: " + material_asset_id + "\n";
							tpl += "\t\t\tName: \"" + pixel_material_name + "\"\n";
							tpl += "\t\t\tPlatformAssetType: 2\n";
							tpl += "\t\t\tPrimaryAsset {\n";
								tpl += "\t\t\t\tAssetType: \"MaterialAssetRef\"\n";
								tpl += "\t\t\t\tAssetId: \"" + pixel_material_asset_id + "\"\n";
							tpl += "\t\t\t}\n";
						tpl += "\t\t}\n";
					}

					tpl += "\t\tPrimaryAssetId {\n";
						tpl += "\t\t\tAssetType: \"None\"\n";
						tpl += "\t\t\tAssetId: \"None\"\n";
					tpl += "\t\t}\n";
				tpl += "\t}\n";
				tpl += "\tSerializationVersion: 70\n";
			tpl += "}";

			$("#total").text(non_merged_counter);
			$("#mergetotal").text(this._rects.length);//MR rectangle count

			this.save(file_n + ".pbt", tpl, merged_counter);
		}
	}

	static save(f, d, objs){
		let blob = new Blob([d], {type: "text/plain"});
		let elem = window.document.createElement("a");
		
		elem.href = window.URL.createObjectURL(blob);
		elem.download = f;

		document.body.appendChild(elem);
		elem.click();        
		document.body.removeChild(elem);
	}

}

// setting initial values for Pixel_Art_To_Template()
Pixel_Art_To_Template._rects = [];
Pixel_Art_To_Template._rectArea = 0;
Pixel_Art_To_Template._data = [];
Pixel_Art_To_Template._width = 0;
Pixel_Art_To_Template._height = 0;



$(() => {

	let file_input = $("#file");
	let preview = $("#preview");
	let context = preview[0].getContext("2d");

	file_input.on("change", evt => {
		if(file_input[0].files.length == 1){
			let the_file = file_input[0].files[0];

			if(the_file.type.match("image/png")){
				let reader = new FileReader();

				reader.onload = event => {

					let image = new Image();
					
					image.src = event.target.result;
			
					image.onload = () => {
						let width = image.width;
						let height = image.height;

						preview.attr({

							width: width,
							height: height

						});

						context.clearRect(0, 0, preview.attr("width"), preview.attr("width"));

						if(!$("#ui").prop("checked")){
							context.save();
							context.translate(preview.attr("width") / 2, preview.attr("height") / 2);		
							context.rotate(180 * Math.PI / 180);
							context.scale(-1, 1);
							context.drawImage(image, -image.width / 2, -image.height / 2);
							context.restore();
						} else {
							context.drawImage(image, 0, 0);
						}

						let name = "Pixel Art - " + the_file.name.split(".")[0];

						Pixel_Art_To_Template.generate(context.getImageData(0, 0, preview.attr("width"), preview.attr("height")), name);
					}
					
				  }
		  
				reader.readAsDataURL(the_file);
			} else {
				console.warn("Image needs to be png format");
			}
		}
	});

});
