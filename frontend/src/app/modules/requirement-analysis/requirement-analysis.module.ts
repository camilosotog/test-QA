import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RequirementAnalysisComponent } from "./components/requirement-analysis.component";
import { RequirementAnalysisService } from "./services/requirement-analysis.service";

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RequirementAnalysisComponent,
  ],
  providers: [RequirementAnalysisService],
})
export class RequirementAnalysisModule {}

export { RequirementAnalysisComponent };
export { RequirementAnalysisService };
