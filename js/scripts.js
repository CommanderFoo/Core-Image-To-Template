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
					combined: data[index] + data[index + 1] + data[index + 2]

				};
			}
		}

		return structured;
	}

	static generate(image_data, file_name){
		this.unique_start_id = +(new Date());

		if(image_data){
			let data = image_data.data;
			let width = image_data.width;
			let height = image_data.height;
		
			let structured_data = this.structure_data(data, width, height);
			let merged_data = new Merge_Pixels(structured_data);
	
			let asset_id = this.get_unique_id();
			let root_id = this.get_unique_id();
			let mesh_asset_id = this.get_unique_id();
			let merged_id = this.get_unique_id();
			let material_asset_id = this.get_unique_id();

			let child_ids = [];
			let child_str = "";

			let non_merged_counter = 0;
			let merged_counter = 0;
			let alpha_cutoff = parseInt($("#alphacutoff").val(), 10);
			let object_scale = parseFloat($("#objectscale").val());
			let is_ui = ($("#ui").prop("checked"))? true : false;

			for(let y = 0; y < height; ++ y){
				for(let x = 0; x < width; ++ x){	
					let pixel_data = merged_data[y][x];
					let pixel_width = pixel_data.width || 1;
					let pixel_height = pixel_data.height || 1;

					if(pixel_data.a < alpha_cutoff){
						continue;
					}

					non_merged_counter ++;

					if(pixel_data.x_parent || pixel_data.y_parent){
						continue;
					}
					
					merged_counter ++;

					let child_id = this.get_unique_id()
					let r = pixel_data.r / 255;
					let g = pixel_data.g / 255;
					let b = pixel_data.b / 255;
					let a = pixel_data.a / 255;

					let pixel_x = 0
					let pixel_y = 0
					let scale_x = 0
					let scale_y = 0

					if(is_ui){
						pixel_x = (((x + (pixel_width / 2)) * (object_scale / 10))).toFixed(4);
						pixel_y = (((y + (pixel_height / 2)) * (object_scale / 10))).toFixed(4);

						scale_x = (pixel_width * (object_scale / 10)).toFixed(0);
						scale_y = (pixel_height * (object_scale / 10)).toFixed(0);
					} else {
						pixel_x = ((x + (pixel_width / 2)) * 10);
						pixel_y = ((y + (pixel_height / 2)) * 10);
				
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
			}
		
			let tpl = "";

			tpl += "Assets {\n";
				tpl += "\tId: " + asset_id + "\n";
				tpl += "\tName: \"" + ((is_ui)? "UI - " : "") + file_name + "\"\n";
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
									tpl += "\t\t\t\t\tWidth: " + (merged_data[0].length * (object_scale / 10)).toFixed(0) + "\n";
									tpl += "\t\t\t\t\tHeight: " + (merged_data.length * (object_scale / 10)).toFixed(0) + "\n";
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
			$("#mergetotal").text(merged_counter);

			this.save(file_name + ".pbt", tpl, merged_counter);
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
