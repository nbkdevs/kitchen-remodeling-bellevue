# frozen_string_literal: true

require_relative "lib/kitchen_remodeling_cost/version"

Gem::Specification.new do |s|
  s.name        = "kitchen-remodeling-cost"
  s.version     = KitchenRemodelingCost::VERSION
  s.summary     = "Kitchen remodeling cost planner: line-item budget split, sales tax, reserve and permits."
  s.description = "Split a kitchen remodel budget across 12 line items (cabinets, labor, appliances, " \
                  "countertops, flooring and more), add sales tax, a contingency reserve and a permit " \
                  "allowance, or price a Cost vs Value preset. Integer-cent maths. Library + CLI, no dependencies."
  s.authors     = ["Bellevue Kitchen Pros"]
  s.license     = "MIT"
  s.homepage    = "https://wakitchenremodelingbellevue.com/"
  s.files       = Dir["lib/**/*.rb", "exe/*", "README.md", "LICENSE"]
  s.bindir      = "exe"
  s.executables = ["kitchen-remodeling-cost"]
  s.required_ruby_version = ">= 3.0"
  s.metadata = {
    "homepage_uri" => "https://wakitchenremodelingbellevue.com/",
    "source_code_uri" => "https://github.com/nbkdevs/kitchen-remodeling-bellevue",
    "bug_tracker_uri" => "https://github.com/nbkdevs/kitchen-remodeling-bellevue/issues",
    "rubygems_mfa_required" => "true"
  }
end
